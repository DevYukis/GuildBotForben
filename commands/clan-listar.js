import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js"; // Fixed import
import { loadClans } from "../utils/clanUtils.js";

export default {
  data: new SlashCommandBuilder()
    .setName("clan-listar")
    .setDescription("Lista todos os Clans existentes ou informações detalhadas de um Clan específico.")
    .addStringOption((option) =>
      option
        .setName("clan")
        .setDescription("Nome ou tag do Clan que deseja listar. Deixe vazio para listar todos.")
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has("Administrator")) {
      return await interaction.reply({
        content: "⚠️ Apenas administradores podem usar este comando.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const clans = loadClans();
    const clanQuery = interaction.options.getString("clan");

    if (!clanQuery) {
      if (clans.size === 0) {
        return await interaction.reply({
          content: "⚠️ Não há nenhum Clan registrado no momento.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle("📜 ADMIN ACCESS: Lista de Clans")
        .setColor(0xff0000) // Red color
        .setDescription("⚠️ **ADMIN ACCESS** ⚠️\nLista de todos os Clans registrados.");

      clans.forEach((clan) => {
        embed.addFields({
          name: `${clan.clanName} [${clan.clanTag}]`,
          value: `**Líder:** <@${clan.leaderId}>\n**Membros:** ${clan.members.length}\n**Descrição:** ${clan.clanDescription || "Sem descrição"}`,
        });
      });

      return await interaction.reply({ embeds: [embed] });
    }

    const clanEntry = Array.from(clans.values()).find(
      (clan) =>
        clan.clanName.toLowerCase() === clanQuery.toLowerCase() ||
        clan.clanTag.toLowerCase() === clanQuery.toLowerCase()
    );

    if (!clanEntry) {
      return await interaction.reply({
        content: `⚠️ O Clan "${clanQuery}" não foi encontrado.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`📜 ADMIN ACCESS: Informações detalhadas do Clan: ${clanEntry.clanName}`)
      .setColor(0xff0000) // Red color
      .setDescription("⚠️ **ADMIN ACCESS** ⚠️\nInformações detalhadas do Clan.")
      .addFields(
        { name: "Tag", value: clanEntry.clanTag, inline: true },
        { name: "Líder", value: `<@${clanEntry.leaderId}>`, inline: true },
        { name: "Descrição", value: clanEntry.clanDescription || "Sem descrição", inline: false },
        { name: "Membros", value: `${clanEntry.members.length}`, inline: true }
      );

    const memberDetails = await Promise.all(
      clanEntry.members.map(async (memberId) => {
        const member = await interaction.guild.members.fetch(memberId).catch(() => null);
        const joinDate = clanEntry.joinDates?.[memberId] || "Data desconhecida";
        const messageCount = clanEntry.messageCounts?.[memberId] || 0;

        return member
          ? `- **${member.user.tag}** (Entrou: ${joinDate}, Mensagens: ${messageCount})`
          : `- **ID: ${memberId}** (Membro não encontrado)`;
      })
    );

    embed.addFields({
      name: "Detalhes dos Membros",
      value: memberDetails.join("\n") || "Nenhum membro encontrado.",
    });

    await interaction.reply({ embeds: [embed] });
  },
};
