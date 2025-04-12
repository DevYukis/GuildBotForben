import { SlashCommandBuilder, MessageFlags } from "discord.js";
import Evento from "../models/Evento.js"; // Modelo para eventos

export default {
  data: new SlashCommandBuilder()
    .setName("iniciar-evento")
    .setDescription("Inicia um evento configurado.")
    .addStringOption((option) =>
      option
        .setName("tipo")
        .setDescription("Escolha o tipo de evento para iniciar.")
        .setRequired(true)
        .addChoices(
          { name: "Perguntas", value: "perguntas" },
          { name: "Desafios", value: "desafios" },
          { name: "Quiz", value: "quiz" },
          { name: "Raid", value: "raid" }
        )
    )
    .addChannelOption((option) =>
      option
        .setName("canal")
        .setDescription("Selecione o canal onde o evento será realizado.")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("pontos")
        .setDescription("Quantos pontos o evento vai valer.")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("moedas")
        .setDescription("Quantas moedas o evento vai valer.")
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName("test")
        .setDescription("Ativar modo de teste (ignora verificações e cria Clans fantasmas).")
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName("membros-fantasmas")
        .setDescription("Número de membros por Clan fantasma (apenas no modo de teste).")
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has("Administrator")) {
      return await interaction.reply({
        content: "⚠️ Apenas administradores podem usar este comando.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const tipo = interaction.options.getString("tipo");
    const canal = interaction.options.getChannel("canal");
    const pontos = interaction.options.getInteger("pontos");
    const moedas = interaction.options.getInteger("moedas");
    const testMode = interaction.options.getBoolean("test") || false;
    const membrosFantasmas = interaction.options.getInteger("membros-fantasmas") || 5;

    // Verifica se o tipo de evento existe no banco de dados
    const evento = await Evento.findOne({ tipo });
    if (!evento) {
      return await interaction.reply({
        content: `⚠️ O tipo de evento "${tipo}" não foi encontrado no banco de dados.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!canal.isTextBased()) {
      return await interaction.reply({
        content: "⚠️ O canal selecionado não é válido para eventos.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Modo de teste: criar Clans fantasmas
    let fakeClans = [];
    if (testMode) {
      for (let i = 1; i <= 5; i++) {
        fakeClans.push({
          clanName: `Clan Fantasma ${i}`,
          members: Array.from({ length: membrosFantasmas }, (_, index) => `Membro${index + 1}`),
        });
      }

      await interaction.reply({
        content: `✅ Modo de teste ativado. Clans fantasmas criados:\n${fakeClans
          .map((clan) => `- ${clan.clanName} (${clan.members.length} membros)`)
          .join("\n")}`,
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.deferReply({ ephemeral: true });
    }

    try {
      // Passar os Clans fantasmas para o evento no modo de teste
      await evento.executar(interaction, canal, pontos, moedas, testMode ? fakeClans : null);

      if (!testMode) {
        await interaction.editReply({
          content: `✅ Evento do tipo **${tipo}** iniciado no canal ${canal} valendo **${pontos} pontos** e **${moedas} moedas**!`,
        });
      }
    } catch (error) {
      console.error("Erro ao executar o evento:", error);
      if (!testMode) {
        await interaction.editReply({
          content: "⚠️ Ocorreu um erro ao iniciar o evento.",
        });
      }
    }
  },
};