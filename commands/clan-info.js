import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { loadClans } from "../utils/clanUtils.js";

export default {
  data: new SlashCommandBuilder()
    .setName("clan-info")
    .setDescription("Exibe informações sobre o Clan do usuário."),

  async execute(interaction) {
    const clans = loadClans();
    const userId = interaction.user.id;

    // Verifica se o usuário pertence a algum Clan
    const clan = Array.from(clans.values()).find(
      (clan) => clan.leaderId === userId || clan.members.includes(userId)
    );

    if (!clan) {
      return await interaction.reply({
        content: "⚠️ Você não pertence a nenhum Clan.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Determina se o usuário é líder ou membro
    const isLeader = clan.leaderId === userId ? "Líder" : "Membro";

    // Calcula a posição no ranking com base nos pontos
    const sortedClans = Array.from(clans.values()).sort((a, b) => (b.points || 0) - (a.points || 0));
    const rankPosition = sortedClans.findIndex((c) => c.clanName === clan.clanName) + 1;

    // Criação da embed com informações do Clan
    const embed = new EmbedBuilder()
      .setTitle(`📜 Informações do Clan: ${clan.clanName}`)
      .setColor(0x3498db) // Azul
      .setDescription(`Aqui estão as informações detalhadas sobre o Clan **${clan.clanName}**.`)
      .addFields(
        { name: "Tag", value: `**${clan.clanTag}**`, inline: true },
        { name: "Cargo", value: `**${isLeader}**`, inline: true },
        { name: "Pontos", value: `**${clan.points || 0}**`, inline: true },
        { name: "Moedas", value: `**${clan.coins || 0}**`, inline: true },
        { name: "Posição no Ranking", value: `**#${rankPosition}**`, inline: true },
        { name: "Membros", value: `**${clan.members.length}**`, inline: true },
        { name: "Data de Criação", value: `**${clan.creationDate || "Desconhecida"}**`, inline: false }
      )
      .setFooter({ text: "Sistema de Clans", iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
};