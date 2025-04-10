import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const deletedClansPath = resolve("data", "deletedClans.json");

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

    if (!existsSync(deletedClansPath)) {
      return await interaction.reply({
        content: "⚠️ Não há registros de Clans deletados.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const deletedClans = JSON.parse(readFileSync(deletedClansPath, "utf-8"));

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
        value: `**Tag:** ${clan.clanTag}\n**Deletado em:** ${clan.deletedAt || "Data desconhecida"}`,
      });
    });

    await interaction.reply({ embeds: [embed] });
  },
};
