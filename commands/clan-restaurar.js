import { SlashCommandBuilder, MessageFlags } from "discord.js";
import DeletedClan from "../models/DeletedClan.js"; // Modelo para Clans deletados
import Clan from "../models/Clan.js"; // Modelo para Clans ativos
import { createClanResources } from "../utils/clanUtils.js";

export default {
  data: new SlashCommandBuilder()
    .setName("clan-restaurar")
    .setDescription("Restaura um Clan deletado.")
    .addStringOption((option) =>
      option
        .setName("clan")
        .setDescription("Nome do Clan que deseja restaurar.")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has("Administrator")) {
      return await interaction.reply({
        content: "⚠️ Apenas administradores podem usar este comando.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const clanName = interaction.options.getString("clan");

    // Busca o Clan deletado no banco de dados
    const deletedClan = await DeletedClan.findOne({ clanName });

    if (!deletedClan) {
      return await interaction.reply({
        content: `⚠️ Não foi possível restaurar o Clan "${clanName}". Verifique se ele existe na lista de Clans deletados.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      // Recria os recursos do Clan (cargos e canais)
      const { roleId, textChannelId, voiceChannelId } = await createClanResources(
        interaction.guild,
        deletedClan.clanName,
        deletedClan.leaderId
      );

      // Atualiza os dados do Clan com os novos IDs de cargo e canais
      const restoredClan = new Clan({
        leaderId: deletedClan.leaderId,
        clanName: deletedClan.clanName,
        clanTag: deletedClan.clanTag,
        clanDescription: deletedClan.clanDescription,
        members: deletedClan.members,
        roleId,
        textChannelId,
        voiceChannelId,
        points: deletedClan.points || 0,
        coins: deletedClan.coins || 0,
        creationDate: deletedClan.creationDate || new Date(),
      });

      // Salva o Clan restaurado no banco de dados
      await restoredClan.save();

      // Remove o Clan da lista de Clans deletados
      await DeletedClan.deleteOne({ _id: deletedClan._id });

      // Reatribui o cargo aos membros do Clan
      const role = interaction.guild.roles.cache.get(roleId);
      if (role) {
        for (const memberId of deletedClan.members) {
          const member = await interaction.guild.members.fetch(memberId).catch(() => null);
          if (member) {
            await member.roles.add(role).catch((error) => {
              console.error(`[ERRO] Não foi possível adicionar o cargo ao membro ${memberId}: ${error}`);
            });
          }
        }
      }

      await interaction.reply({
        content: `✅ O Clan "${clanName}" foi restaurado com sucesso. O cargo e os canais foram recriados, e os membros receberam o cargo novamente.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error(`Erro ao restaurar o Clan "${clanName}":`, error);
      await interaction.reply({
        content: `⚠️ Ocorreu um erro ao restaurar o Clan "${clanName}".`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
