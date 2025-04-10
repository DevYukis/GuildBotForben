import fs from "fs";
import path from "path";
import { Collection } from "discord.js";

export const loadCommands = async (client) => {
  client.commands = new Collection(); // Inicializa como Collection
  client.commands.clear(); // Limpa os comandos existentes
  const commands = [];
  const commandsPath = path.resolve("commands");

  // Verifica se a pasta de comandos existe
  if (!fs.existsSync(commandsPath)) {
    console.error(`⚠️ A pasta 'commands' não foi encontrada no caminho: ${commandsPath}`);
    return commands;
  }

  // Filtra arquivos que terminam com .js
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);

    try {
      const command = await import(`file://${filePath}`);

      if (command.default?.data) {
        // Adiciona o comando à coleção e à lista de comandos
        client.commands.set(command.default.data.name, command.default);
        commands.push(command.default.data.toJSON());
      } else if (command.default?.name) {
        // Adiciona comandos que possuem apenas a propriedade 'name'
        client.commands.set(command.default.name, command.default);
      } else if (file === "bot-teste.js") {
        console.warn(`⚠️ O comando 'bot-teste' foi encontrado, mas está com estrutura inválida.`);
      } else {
        console.warn(`⚠️ O comando no arquivo '${file}' não possui uma propriedade 'data' ou 'name'.`);
      }
    } catch (error) {
      console.error(`❌ Erro ao carregar o comando '${file}':`, error);
    }
  }

  return commands;
};