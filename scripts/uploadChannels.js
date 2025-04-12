import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import ChannelConfig from "../models/ChannelConfig.js";

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

// Obter a URI do MongoDB da variável de ambiente
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error("Erro: MONGO_URI não definida no arquivo .env");
  process.exit(1);
}

// Obter o serverId da variável de ambiente ou definir um padrão
const serverId = process.env.SERVER_ID; // Certifique-se de definir isso no .env
if (!serverId) {
  console.error("Erro: SERVER_ID não definido no arquivo .env");
  process.exit(1);
}

// Conexão com o MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log("Conectado ao MongoDB"))
  .catch((err) => console.error("Erro ao conectar ao MongoDB:", err));

// Caminho do arquivo JSON
const jsonFilePath = path.resolve(
  "/workspaces/GuildBotForben/data/channels.json"
);

// Função para carregar os dados
const uploadChannels = async () => {
  try {
    // Ler o arquivo JSON
    const data = JSON.parse(fs.readFileSync(jsonFilePath, "utf-8"));

    // Preparar os dados para inserção
    const updateData = {
      serverId,
      clanCategoryId: data.Clan_category,
    };

    // Atualizar ou criar o documento no banco
    await ChannelConfig.findOneAndUpdate(
      { serverId }, // Filtro
      { $set: updateData }, // Dados a serem atualizados
      { upsert: true, new: true } // Criar se não existir
    );

    console.log("Dados inseridos/atualizados com sucesso!");
  } catch (err) {
    console.error("Erro ao carregar os dados:", err);
  } finally {
    mongoose.connection.close();
  }
};

// Executar a função
uploadChannels();