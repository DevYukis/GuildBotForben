import { SlashCommandBuilder, MessageFlags } from "discord.js";
import Clan from "../models/Clan.js";

export default {
  data: new SlashCommandBuilder()
    .setName("clan-restaurar-todos")
    .setDescription("Restaura todos os Clans com base nos cargos e canais existentes no servidor."),

  async execute(interaction) {
    if (!interaction.member.permissions.has("Administrator")) {
      return await interaction.reply({
        content: "⚠️ Apenas administradores podem usar este comando.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const guild = interaction.guild;

    // Padrão para identificar Clans (ajuste conforme necessário)
    const clanRolePattern = /^《👥》(.+)$/;

    const restoredClans = [];

    try {
      // Iterar sobre os cargos do servidor
      const roles = guild.roles.cache.filter((role) => clanRolePattern.test(role.name));

      for (const role of roles.values()) {
        const clanNameMatch = role.name.match(clanRolePattern);
        if (!clanNameMatch) continue;

        const clanName = clanNameMatch[1];

        // Encontrar o líder do Clan (primeiro membro com o cargo)
        const membersWithRole = role.members;
        const leader = membersWithRole.first(); // Assume o primeiro membro como líder

        if (!leader) {
          console.warn(`⚠️ Nenhum líder encontrado para o Clan "${clanName}".`);
          continue;
        }

        // Procurar canais associados ao Clan
        const textChannel = guild.channels.cache.find(
          (channel) => channel.type === 0 && channel.name === role.name
        );
        const voiceChannel = guild.channels.cache.find(
          (channel) => channel.type === 2 && channel.name === role.name
        );

        // Reconstruir o Clan no banco de dados
        const clan = new Clan({
          leaderId: leader.id,
          clanName,
          clanTag: "", // Adicione lógica para identificar tags, se necessário
          clanDescription: "Restaurado automaticamente.",
          members: membersWithRole.map((member) => member.id),
          roleId: role.id,
          textChannelId: textChannel?.id || null,
          voiceChannelId: voiceChannel?.id || null,
          points: 0, // Pontos podem ser restaurados manualmente, se necessário
          coins: 0, // Moedas podem ser restauradas manualmente, se necessário
          creationDate: new Date(), // Data de restauração
        });

        await clan.save();
        restoredClans.push(clanName);
      }

      if (restoredClans.length === 0) {
        return await interaction.reply({
          content: "⚠️ Nenhum Clan foi encontrado para restaurar.",
          flags: MessageFlags.Ephemeral,
        });
      }

      await interaction.reply({
        content: `✅ Os seguintes Clans foram restaurados com sucesso:\n- ${restoredClans.join("\n- ")}`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("[ERRO] Falha ao restaurar Clans:", error);
      await interaction.reply({
        content: "⚠️ Ocorreu um erro ao restaurar os Clans.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};