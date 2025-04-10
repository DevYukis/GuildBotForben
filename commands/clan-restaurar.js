import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { restoreDeletedClan, saveClans, createClanResources, loadClans } from "../utils/clanUtils.js";

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
    const deletedClan = restoreDeletedClan(clanName);

    if (!deletedClan) {
      return await interaction.reply({
        content: `⚠️ Não foi possível restaurar o Clan "${clanName}". Verifique se ele existe em deletedClans.json.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const clans = loadClans();

    try {
      // Recreate the role and channel for the clan
      const { roleId, channelId } = await createClanResources(
        interaction.guild,
        deletedClan.clanName,
        deletedClan.leaderId
      );

      // Update the clan data with the new role and channel IDs
      deletedClan.roleId = roleId;
      deletedClan.channelId = channelId;

      // Add the restored clan back to the clans list
      clans.set(deletedClan.leaderId, deletedClan);
      saveClans(clans);

      // Reassign the role to all members of the clan
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
        content: `✅ O Clan "${clanName}" foi restaurado com sucesso. O cargo e o canal foram recriados, e os membros receberam o cargo novamente.`,
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
