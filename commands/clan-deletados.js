import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import DeletedClan from "../models/DeletedClan.js"; // Modelo para Clans deletados

export default {
  data: new SlashCommandBuilder()
    .setName("clan-deletados")
    .setDescription("Exibe a lista de Clans deletados e a data em que foram deletados."),

  async execute(interaction) {
    if (!interaction.member.permissions.has("Administrator")) {
      return await interaction.reply({
        content: "⚠️ Apenas administradores podem usar este comando.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Busca os Clans deletados no banco de dados
    const deletedClans = await DeletedClan.find();

    if (deletedClans.length === 0) {
      return await interaction.reply({
        content: "⚠️ Não há registros de Clans deletados.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("📜 Lista de Clans Deletados")
      .setColor(0xe74c3c);

    deletedClans.forEach((clan) => {
      embed.addFields({
        name: clan.clanName,
        value: `**Tag:** ${clan.clanTag}\n**Deletado em:** ${new Date(clan.deletedAt).toLocaleDateString("pt-BR") || "Data desconhecida"}`,
      });
    });

    await interaction.reply({ embeds: [embed] });
  },
};
