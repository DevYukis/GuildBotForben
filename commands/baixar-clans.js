import { SlashCommandBuilder, MessageFlags, AttachmentBuilder } from "discord.js";
import fs from "fs";
import path from "path";
import { loadClans } from "../utils/clanUtils.js";

export default {
  data: new SlashCommandBuilder()
    .setName("baixar-clans")
    .setDescription("Permite que administradores baixem os dados dos Clans."),

  async execute(interaction) {
    // Verifica se o usuário tem permissão de administrador
    if (!interaction.member.permissions.has("Administrator")) {
      return await interaction.reply({
        content: "⚠️ Apenas administradores podem usar este comando.",
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      // Carrega os Clans do banco de dados
      const clans = await loadClans();

      // Converte o Map para um objeto simples
      const clansObject = Object.fromEntries(clans);

      // Define o caminho do arquivo temporário
      const filePath = path.resolve("./data/clans_temp.json");

      // Salva os dados em um arquivo JSON temporário
      fs.writeFileSync(filePath, JSON.stringify(clansObject, null, 2));

      // Cria o anexo do arquivo
      const file = new AttachmentBuilder(filePath, { name: "clans.json" });

      // Envia o arquivo como anexo
      await interaction.reply({
        content: "📂 Aqui está o arquivo de Clans:",
        files: [file],
        flags: MessageFlags.Ephemeral,
      });

      // Remove o arquivo temporário após o envio
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error("Erro ao gerar o arquivo de Clans:", error);
      return await interaction.reply({
        content: "❌ Ocorreu um erro ao gerar o arquivo de Clans.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};