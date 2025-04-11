import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("list-commands")
    .setDescription("Lista todos os comandos disponíveis e verifica quais são exclusivos para administradores.")
    .setDefaultPermission(true),

  async execute(interaction) {
    // Verificar se o usuário é administrador
    const isAdmin = interaction.member.permissions.has("Administrator");

    if (!isAdmin) {
      return await interaction.reply({
        content: "⚠️ Apenas administradores podem usar este comando.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Verificar se os comandos estão carregados
    const commands = interaction.client.commands;
    if (!commands || commands.size === 0) {
      return await interaction.reply({
        content: "⚠️ Nenhum comando foi encontrado.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Criar embed para listar os comandos
    const embed = new EmbedBuilder()
      .setTitle("🚨 **ADMIN ACCESS** 🚨")
      .setColor(0xff0000) // Vermelho
      .setDescription("📜 **Lista de Comandos Disponíveis**\n\n**Somente administradores podem usar este comando.**")
      .setTimestamp();

    // Adicionar cada comando ao embed
    commands.forEach((command) => {
      if (command.data && command.data.name) {
        const isAdminOnly = command.data.defaultPermission === false; // Verifica se o comando é exclusivo para administradores
        embed.addFields({
          name: `/${command.data.name}`,
          value: `${command.data.description || "Sem descrição."} ${
            isAdminOnly ? "⚠️ **Somente para administradores**" : ""
          }`,
          inline: false,
        });
      }
    });

    // Enviar a lista de comandos
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};