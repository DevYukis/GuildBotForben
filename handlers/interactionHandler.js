export const handleInteractionCreate = async (interaction, client) => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error("Erro ao executar o comando:", error);
      await interaction.reply({
        content: "⚠️ Ocorreu um erro ao executar este comando.",
        flags: 64, // Updated from ephemeral
      });
    }
  } else if (interaction.isButton()) {
    console.log(`Botão pressionado: ${interaction.customId}`);
    // Adicione lógica para botões aqui
  } else if (interaction.isStringSelectMenu()) {
    console.log(`Menu selecionado: ${interaction.customId}`);
    // Adicione lógica para menus aqui
  }
};