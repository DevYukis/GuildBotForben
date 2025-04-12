import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { loadClans } from "../utils/clanUtils.js";

export default {
  data: new SlashCommandBuilder()
    .setName("clan-ranking")
    .setDescription("Exibe o ranking dos Clans.")
    .addStringOption((option) =>
      option
        .setName("tipo")
        .setDescription("Escolha o tipo de ranking: pontos ou moedas.")
        .setRequired(true)
        .addChoices(
          { name: "Pontos", value: "pontos" },
          { name: "Moedas", value: "moedas" }
        )
    ),

  async execute(interaction) {
    // Carrega os Clans do banco de dados
    const clans = await loadClans();

    if (clans.size === 0) {
      return await interaction.reply({
        content: "⚠️ Não há Clans registrados no momento.",
        ephemeral: true,
      });
    }

    const rankingType = interaction.options.getString("tipo");

    // Ordena os Clans com base no tipo de ranking
    const sortedClans = Array.from(clans.values()).sort((a, b) => {
      if (rankingType === "pontos") {
        return (b.points || 0) - (a.points || 0);
      } else if (rankingType === "moedas") {
        return (b.coins || 0) - (a.coins || 0);
      }
    });

    // Cria a embed para exibir o ranking
    const embed = new EmbedBuilder()
      .setTitle(
        rankingType === "pontos"
          ? "🏆 Ranking dos Clans - Pontos"
          : "💰 Ranking dos Clans - Moedas"
      )
      .setColor(rankingType === "pontos" ? 0xffd700 : 0x00bfff) // Dourado para pontos, azul para moedas
      .setDescription(
        rankingType === "pontos"
          ? "Os Clans mais bem colocados com base nos pontos acumulados."
          : "Os Clans mais bem colocados com base nas moedas acumuladas."
      );

    // Adiciona os Clans ao ranking (máximo de 10)
    sortedClans.slice(0, 10).forEach((clan, index) => {
      embed.addFields({
        name: `${index + 1}. ${clan.clanName} [${clan.clanTag}]`,
        value:
          rankingType === "pontos"
            ? `**Pontos:** ${clan.points || 0}`
            : `**Moedas:** ${clan.coins || 0}`,
        inline: false,
      });
    });

    embed.setFooter({
      text: "Ranking atualizado",
      iconURL: interaction.client.user.displayAvatarURL(),
    }).setTimestamp();

    // Envia a embed com o ranking
    await interaction.reply({ embeds: [embed] });
  },
};