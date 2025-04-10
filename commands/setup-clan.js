import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } from "discord.js";
import { handleInteraction as handleInteractionHandlers } from "../handlers/interactionHandlers.js";

export default {
  data: new SlashCommandBuilder()
    .setName("setup-clan")
    .setDescription("Cria a mensagem interativa para gerenciar Clans.")
    .addChannelOption((option) =>
      option
        .setName("canal")
        .setDescription("Selecione o canal onde a mensagem será enviada.")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  async execute(interaction) {
    // Verifica se o usuário tem permissão de administrador
    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.reply({
        content: "⚠️ Apenas administradores podem usar este comando.",
        ephemeral: true,
      });
    }

    const channel = interaction.options.getChannel("canal");

    const embed = {
      title: "🛡️ **Sistema de Clans – Central de Gerenciamento**",
      description:
        "Bem-vindo ao **Sistema de Clans**! Aqui você pode **criar**, **editar**, **excluir** ou **gerenciar os membros** do seu próprio Clan no Discord.\n\n" +
        "━━━━━━━━━━━━━━━━━━━\n" +
        "🔍 **O que é um Clan?**\n" +
        "Um **Clan** é um grupo personalizado dentro da comunidade, criado para unir jogadores com o mesmo objetivo — seja competir, cooperar ou socializar.\n\n" +
        "━━━━━━━━━━━━━━━━━━━\n" +
        "⚙️ **Funções disponíveis**:\n\n" +
        "🔹 **Criar Clan** – Configure nome, descrição e imagem.\n" +
        "🔹 **Editar Clan** – Altere as informações do seu grupo.\n" +
        "🔹 **Excluir Clan** – Remova o seu Clan permanentemente.\n" +
        "🔹 **Editar Membros** – Adicione, remova e gerencie os integrantes.\n\n" +
        "━━━━━━━━━━━━━━━━━━━\n" +
        "🏆 **Vantagens de ter um Clan**:\n\n" +
        "✅ **Cargo exclusivo no Discord**\n" +
        "➥ Cada Clan recebe um **cargo personalizado** com o nome e cor do grupo.\n\n" +
        "✅ **Canal de texto privado**\n" +
        "➥ Os membros do Clan terão acesso a um canal exclusivo para conversar e planejar.\n\n" +
        "✅ **Participação em eventos e guerras**\n" +
        "➥ Clans poderão disputar **guerras territoriais**, **torneios**, **eventos especiais** e muito mais!\n\n" +
        "✅ **Sistema de hierarquia**\n" +
        "➥ Estrutura com **Líder**, **Sub-líderes** e **Membros**, com permissões definidas.\n\n" +
        "✅ **Notificações automáticas**\n" +
        "➥ Toda ação relevante do seu Clan será anunciada automaticamente no servidor.\n\n" +
        "━━━━━━━━━━━━━━━━━━━\n" +
        "📌 **Atenção:** Apenas líderes e membros com permissão de gerenciamento podem editar ou excluir o Clan.\n\n" +
        "━━━━━━━━━━━━━━━━━━━\n" +
        "⚔️ **Pronto para começar?**\n" +
        "Use os botões abaixo para gerenciar seu Clan:\n" +
        "> `Criar Clan` | `Editar Clan` | `Excluir Clan` | `Editar Membros`",
      color: 0x9b59b6, // Cor roxa
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("create_clan_button")
        .setLabel("Criar Clan")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("edit_clan_button")
        .setLabel("Editar Clan")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("delete_clan_button")
        .setLabel("Excluir Clan")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("edit_members_button")
        .setLabel("Editar Membros")
        .setStyle(ButtonStyle.Secondary) // Botão para gerenciar membros
    );

    try {
      const message = await channel.send({ embeds: [embed], components: [row] });

      // Registra as interações nos handlers
      handleInteractionHandlers(message);

      await interaction.reply({
        content: `✅ Mensagem interativa enviada com sucesso no canal <#${channel.id}>.`,
        ephemeral: true,
      });

      // Envia uma mensagem na DM do usuário
      const dmEmbed = {
        title: "🎉 Você foi adicionado ao Clan!",
        description: `Parabéns! Você foi adicionado ao Clan no servidor **${interaction.guild.name}**.`,
        color: 0x9b59b6, // Cor roxa
      };

      try {
        await interaction.user.send({ embeds: [dmEmbed] });
      } catch (dmError) {
        console.error("[ERRO] Não foi possível enviar a mensagem na DM:", dmError);
      }
    } catch (error) {
      console.error("[ERRO] Não foi possível enviar a mensagem no canal:", error);
      await interaction.reply({
        content: "⚠️ Ocorreu um erro ao enviar a mensagem no canal selecionado.",
        ephemeral: true,
      });
    }
  },
};
