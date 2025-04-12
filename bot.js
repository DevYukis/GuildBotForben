import dotenv from "dotenv";
import mongoose from "mongoose";
import client from "./client.js"; // Importa o cliente já inicializado
import { loadCommands } from "./utils/commandLoader.js";
import { registerSlashCommands } from "./utils/slashCommandRegistrar.js";
import { handlePrefixCommand } from "./handlers/prefixCommandHandler.js";
import { PREFIX } from "./config.js";
import { handleInteraction } from "./handlers/interactionHandlers.js";
import { handleInteractionCreate } from "./handlers/interactionHandler.js";
import { handleUpdateSlashCommand } from "./handlers/updateSlashCommandHandler.js";

dotenv.config();

const connectDB = async () => {
  try {
    console.log("🔄 Tentando conectar ao MongoDB...");
    await mongoose.connect(process.env.MONGO_URI); // Removidas as opções obsoletas
    console.log("✅ Conectado ao MongoDB com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao conectar ao MongoDB:", error.message);
    process.exit(1);
  }
};

// Conecta ao MongoDB
await connectDB();

// Carrega os comandos
const commands = await loadCommands(client);

// Registra os comandos Slash e inicia o bot
client.once("ready", async () => {
  await registerSlashCommands(client, commands);
  console.log(`🚀 Bot online como ${client.user.tag}`);
});

// Lida com interações
client.on("interactionCreate", async (interaction) => {
  await handleInteraction(interaction);
  await handleInteractionCreate(interaction, client);
  await handleUpdateSlashCommand(interaction, client);
});

// Lida com comandos com prefixo
client.on("messageCreate", async (message) => {
  await handlePrefixCommand(message, client, PREFIX);
});

// Inicia o bot
client.login(process.env.TOKEN);
