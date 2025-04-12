import { SlashCommandBuilder, MessageFlags } from "discord.js";
import fs from "fs";

const eventosPath = "data/eventos.json";

function loadEventos() {
  if (!fs.existsSync(eventosPath)) {
    fs.writeFileSync(eventosPath, JSON.stringify({ eventos: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(eventosPath, "utf-8"));
}

function saveEventos(eventos) {
  fs.writeFileSync(eventosPath, JSON.stringify(eventos, null, 2));
}

export default {
  data: new SlashCommandBuilder()
    .setName("clan-evento")
    .setDescription("Configura um evento interativo para os Clans.")
    .addStringOption((option) =>
      option
        .setName("nome")
        .setDescription("Nome do evento.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("descricao")
        .setDescription("Descrição do evento.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("tipo")
        .setDescription("Escolha o tipo de evento.")
        .setRequired(true)
        .addChoices(
          { name: "Raid", value: "raid" },
          { name: "Perguntas", value: "perguntas" },
          { name: "Desafios", value: "desafios" },
          { name: "Quiz", value: "quiz" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("metodo")
        .setDescription("Escolha o método de vitória.")
        .setRequired(true)
        .addChoices(
          { name: "RNG (Aleatório)", value: "rng" },
          { name: "Pontos", value: "pontos" },
          { name: "Moedas", value: "moedas" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("mensagem")
        .setDescription("Mensagem personalizada para a embed do evento.")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has("Administrator")) {
      return await interaction.reply({
        content: "⚠️ Apenas administradores podem usar este comando.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const nome = interaction.options.getString("nome");
    const descricao = interaction.options.getString("descricao");
    const tipo = interaction.options.getString("tipo");
    const metodo = interaction.options.getString("metodo");
    const mensagem = interaction.options.getString("mensagem");

    const eventos = loadEventos();
    eventos.eventos.push({
      nome,
      descricao,
      tipo,
      metodo,
      mensagem,
      criadoPor: interaction.user.id,
      criadoEm: new Date().toISOString(),
    });
    saveEventos(eventos);

    const embed = {
      title: `✅ Evento Configurado: ${nome}`,
      description: `**Descrição:** ${descricao}\n**Tipo:** ${tipo}\n**Método de Vitória:** ${metodo}\n**Mensagem:** ${mensagem}`,
      color: 0x00ff00, // Verde
      footer: { text: "Sistema de Clans" },
      timestamp: new Date(),
    };

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
};