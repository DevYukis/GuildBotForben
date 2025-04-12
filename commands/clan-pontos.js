import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { loadClans, saveClans } from "../utils/clanUtils.js";

export default {
  data: new SlashCommandBuilder()
    .setName("clan-pontos")
    .setDescription("Adiciona ou remove pontos e moedas de um Clan.")
    .addStringOption((option) =>
      option
        .setName("clan")
        .setDescription("Nome ou tag do Clan.")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("pontos")
        .setDescription("Quantidade de pontos a adicionar/remover.")
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName("moedas")
        .setDescription("Quantidade de moedas a adicionar/remover.")
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has("Administrator")) {
      return await interaction.reply({
        content: "⚠️ Apenas administradores podem usar este comando.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const clans = await loadClans(); // Certifique-se de usar await para resolver a Promise
    const clanQuery = interaction.options.getString("clan");
    const points = interaction.options.getInteger("pontos") || 0;
    const coins = interaction.options.getInteger("moedas") || 0;

    // Procura o Clan no Map
    const clan = Array.from(clans.values()).find(
      (c) =>
        c.clanName.toLowerCase() === clanQuery.toLowerCase() ||
        c.clanTag.toLowerCase() === clanQuery.toLowerCase()
    );

    if (!clan) {
      return await interaction.reply({
        content: `⚠️ O Clan "${clanQuery}" não foi encontrado.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    // Atualiza os pontos e moedas do Clan
    clan.points = (clan.points || 0) + points;
    clan.coins = (clan.coins || 0) + coins;

    // Salva os Clans atualizados no banco de dados
    await saveClans(clans);

    const embed = new EmbedBuilder()
      .setTitle("🏆 Pontos e Moedas Atualizados!")
      .setColor(0x00ff00) // Verde
      .setDescription(`Os pontos e moedas do Clan foram atualizados com sucesso.`)
      .addFields(
        { name: "Clan", value: `**${clan.clanName}**`, inline: true },
        { name: "Tag", value: `**${clan.clanTag}**`, inline: true },
        { name: "Pontos Adicionados", value: `**${points}**`, inline: true },
        { name: "Moedas Adicionadas", value: `**${coins}**`, inline: true },
        { name: "Total de Pontos", value: `**${clan.points}**`, inline: true },
        { name: "Total de Moedas", value: `**${clan.coins}**`, inline: true }
      )
      .setFooter({ text: "Sistema de Clans", iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
};