import { REST, Routes } from "discord.js";

export const registerSlashCommands = async (client, commands) => {
  try {
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("✅ Comandos Slash registrados com sucesso!");
  } catch (error) {
    console.error("Erro ao registrar comandos Slash:", error);
  }
};