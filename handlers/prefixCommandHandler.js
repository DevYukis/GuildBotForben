export const handlePrefixCommand = async (message, client, PREFIX) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    console.log(`[LOG] Executando comando com prefixo: ${commandName}`);
    await command.execute(message, args, client);
  } catch (error) {
    console.error("Erro ao executar o comando:", error);
    await message.reply("⚠️ Ocorreu um erro ao executar este comando!");
  }
};