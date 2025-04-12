import { SlashCommandBuilder, MessageFlags, AttachmentBuilder } from "discord.js";
import fs from "fs";

export default {
  data: new SlashCommandBuilder()
    .setName("baixar-clans")
    .setDescription("Permite que administradores baixem o arquivo de Clans."),

  async execute(interaction) {
    // Verifica se o usuário tem permissão de administrador
    if (!interaction.member.permissions.has("Administrator")) {
      return await interaction.reply({
        content: "⚠️ Apenas administradores podem usar este comando.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const filePath = "./data/clans.json"; // Caminho do arquivo de Clans

    // Verifica se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return await interaction.reply({
        content: "⚠️ O arquivo de Clans não foi encontrado.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Cria o anexo do arquivo
    const file = new AttachmentBuilder(filePath, { name: "clans.json" });

    // Envia o arquivo como anexo
    await interaction.reply({
      content: "📂 Aqui está o arquivo de Clans:",
      files: [file],
      flags: MessageFlags.Ephemeral,
    });
  },
};