import fs from "fs";
import path from "path";
import { SlashCommandBuilder } from "discord.js";

// Caminho para o arquivo test.json
const testFilePath = path.resolve("data", "test.json");

// Função para carregar as respostas do arquivo
const loadResponses = () => {
  if (fs.existsSync(testFilePath)) {
    try {
      const data = fs.readFileSync(testFilePath, "utf-8");
      return JSON.parse(data || "{}");
    } catch (error) {
      console.error("[ERRO] Não foi possível carregar o arquivo test.json:", error);
      return {};
    }
  }
  return {};
};

// Função para salvar as respostas no arquivo
const saveResponses = (responses) => {
  try {
    fs.writeFileSync(testFilePath, JSON.stringify(responses, null, 2));
  } catch (error) {
    console.error("[ERRO] Não foi possível salvar o arquivo test.json:", error);
  }
};

export default {
  data: new SlashCommandBuilder()
    .setName("test")
    .setDescription("Envia uma pergunta interativa para o usuário mencionado na DM.")
    .addUserOption((option) =>
      option
        .setName("usuario")
        .setDescription("Usuário para quem enviar a pergunta.")
        .setRequired(true)
    ),
  async execute(interaction) {
    const mentionedUser = interaction.options.getUser("usuario");

    if (!mentionedUser) {
      return interaction.reply({
        content: "⚠️ Você precisa mencionar um usuário válido.",
        ephemeral: true,
      });
    }

    try {
      // Cria um canal de DM com o usuário mencionado
      const dmChannel = await mentionedUser.createDM();

      // Envia a mensagem na DM
      const questionMessage = await dmChannel.send({
        content: "Você recebeu uma pergunta interativa. Responda com **Sim**, **Não**, **Yes** ou **No**.",
      });

      // Responde ao comando no canal original
      await interaction.reply({
        content: `✅ Uma DM foi enviada para ${mentionedUser.tag}.`,
        ephemeral: true,
      });

      // Cria um coletor de mensagens para capturar a resposta na DM
      const filter = (msg) =>
        msg.author.id === mentionedUser.id &&
        ["sim", "não", "nao", "yes", "no", "y", "n"].includes(msg.content.toLowerCase());

      const collector = dmChannel.createMessageCollector({
        filter,
        time: 0, // Sem limite de tempo
      });

      collector.on("collect", (msg) => {
        const response = msg.content.toLowerCase();
        let finalResponse;

        if (["sim", "y", "yes"].includes(response)) {
          finalResponse = "Sim";
        } else if (["não", "nao", "n", "no"].includes(response)) {
          finalResponse = "Não";
        }

        // Salva a resposta no arquivo
        const responses = loadResponses();
        responses[mentionedUser.id] = finalResponse;
        saveResponses(responses);

        // Responde na DM
        msg.reply(`✅ Sua resposta foi registrada como '${finalResponse}'.`);

        // Para o coletor após a resposta
        collector.stop();
      });

      collector.on("end", (collected, reason) => {
        if (reason !== "user") {
          console.log("[INFO] Coletor encerrado:", reason);
        }
      });
    } catch (error) {
      console.error(`[ERRO] Não foi possível enviar a DM para ${mentionedUser.tag}:`, error);
      return interaction.reply({
        content: "⚠️ Não foi possível enviar a DM para o usuário mencionado.",
        ephemeral: true,
      });
    }
  },
};
