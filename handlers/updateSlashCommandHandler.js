import { loadCommands } from "../utils/commandLoader.js";
import { registerSlashCommands } from "../utils/slashCommandRegistrar.js";

export const handleUpdateSlashCommand = async (interaction, client) => {
  if (!interaction.isCommand() || interaction.commandName !== "update-slash") return;

  try {
    const commands = await loadCommands(client);
    await registerSlashCommands(client, commands);

    await interaction.reply({
      content: "✅ Comandos Slash atualizados com sucesso!",
      ephemeral: true,
    });
  } catch (error) {
    console.error("Erro ao atualizar os comandos Slash:", error);
    await interaction.reply({
      content: "⚠️ Ocorreu um erro ao atualizar os comandos Slash.",
      ephemeral: true,
    });
  }
};
