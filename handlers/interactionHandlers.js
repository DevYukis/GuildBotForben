import { createClanModal, editClanModal, deleteClanModal } from "../utils/modalBuilders.js";
import { loadClans, saveClans, getCategoryChannelId, createClanResources, deleteClanResources, saveMemberJoinDate, updateClanVoiceChannelName } from "../utils/clanUtils.js";
import { loadInvites, saveInvites } from "../utils/inviteUtils.js";
import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import Clan from "../models/Clan.js"; // Importa o modelo Clan para interações diretas com o banco de dados
import DeletedClan from "../models/DeletedClan.js"; // Importa o modelo DeletedClan para interações diretas com o banco de dados

// Atualizar os nomes dos canais ao editar o Clan
export const updateClanResources = async (guild, clan) => {
  const formattedName = `《👥》${clan.clanName}`; // Adiciona o prefixo ao nome do Clan

  // Atualizar o nome do cargo
  const role = guild.roles.cache.get(clan.roleId);
  if (role) {
    await role.setName(formattedName);
  }

  // Atualizar o nome do canal de texto
  const textChannel = guild.channels.cache.get(clan.textChannelId);
  if (textChannel) {
    await textChannel.setName(formattedName);
  }

  // Atualizar o nome do canal de voz
  const voiceChannel = guild.channels.cache.get(clan.voiceChannelId);
  if (voiceChannel) {
    await voiceChannel.setName(formattedName);
  }
};

export const handleInteraction = async (interaction) => {
  // Verifica se a interação é válida
  if (!interaction || typeof interaction.isButton !== "function") {
    console.warn("Interação ignorada: tipo não suportado ou inválido.");
    return;
  }

  // Carregar os Clans do banco de dados
  const clans = await loadClans(); // Certifique-se de usar await para resolver a Promise

  // Verifica se a interação é do tipo esperado
  if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit()) {
    console.warn("Interação ignorada: tipo não suportado.");
    return;
  }

  const userId = interaction.user?.id;
  if (!userId) {
    console.error("Usuário não encontrado na interação.");
    return await interaction.reply({
      content: "⚠️ Ocorreu um erro ao processar sua interação.",
      flags: 64,
    });
  }

  if (interaction.isButton()) {
    if (interaction.customId === "create_clan_button") {
      const existingClan = await Clan.findOne({ leaderId: userId });
      if (existingClan) {
        return await interaction.reply({
          content: "⚠️ Você já é dono de um Clan! Edite ou exclua o Clan existente antes de criar outro.",
          flags: 64,
        });
      }

      const modal = createClanModal();
      if (!modal) {
        console.error("Erro ao criar o modal de criação de Clan.");
        return await interaction.reply({
          content: "⚠️ Ocorreu um erro ao abrir o modal de criação de Clan.",
          flags: 64,
        });
      }
      return await interaction.showModal(modal);
    } else if (interaction.customId === "edit_clan_button") {
      const clan = await Clan.findOne({ leaderId: userId });

      if (!clan) {
        return await interaction.reply({
          content: "⚠️ Você não é dono de nenhum Clan para editar.",
          flags: 64,
        });
      }

      const modal = editClanModal(clan);
      if (!modal) {
        console.error("Erro ao criar o modal de edição de Clan.");
        return await interaction.reply({
          content: "⚠️ Ocorreu um erro ao abrir o modal de edição de Clan.",
          flags: 64,
        });
      }

      return await interaction.showModal(modal);
    } else if (interaction.customId === "delete_clan_button") {
      const clan = await Clan.findOne({ leaderId: userId });

      if (!clan) {
        return await interaction.reply({
          content: "⚠️ Você não é dono de nenhum Clan para excluir.",
          flags: 64,
        });
      }

      const modal = deleteClanModal();
      if (!modal) {
        console.error("Erro ao criar o modal de exclusão de Clan.");
        return await interaction.reply({
          content: "⚠️ Ocorreu um erro ao abrir o modal de exclusão de Clan.",
          flags: 64,
        });
      }
      return await interaction.showModal(modal);
    } else if (interaction.customId.startsWith("accept_clan_invite_")) {
      const invites = loadInvites();
      const inviteData = invites.get(interaction.customId);

      if (!inviteData) {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "⚠️ O convite não foi encontrado. Ele pode ter expirado ou sido removido.",
            flags: 64,
          });
        }
        return;
      }

      const { guildId, leaderId, memberId } = inviteData;

      // Buscar o servidor pelo ID
      let guild = interaction.client.guilds.cache.get(guildId);

      if (!guild) {
        try {
          guild = await interaction.client.guilds.fetch(guildId);
        } catch (error) {
          console.error(`[ERRO] Não foi possível buscar o servidor: ${error}`);
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: "⚠️ O servidor associado ao convite não foi encontrado.",
              flags: 64,
            });
          }
          return;
        }
      }

      const clan = await Clan.findOne({ leaderId });

      if (!clan) {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "⚠️ O Clan associado ao convite não foi encontrado.",
            flags: 64,
          });
        }
        return;
      }

      // Adicionar o membro ao Clan
      if (!Array.isArray(clan.members)) {
        clan.members = [];
      }

      if (!clan.members.includes(memberId)) {
        clan.members.push(memberId);
        await clan.save();

        // Remover o convite após ser aceito
        invites.delete(interaction.customId);
        saveInvites(invites);
      }

      const role = guild.roles.cache.get(clan.roleId);

      if (role) {
        try {
          const member = await guild.members.fetch(memberId); // Buscar o membro no servidor
          await member.roles.add(role); // Adicionar o cargo ao membro

          // Enviar DM para o membro confirmando a entrada
          await member.send(`✅ Você entrou no Clan **${clan.clanName}** no servidor **${guild.name}**!`);

          // Enviar DM para o líder confirmando que o membro aceitou
          const leader = await guild.members.fetch(leaderId);
          await leader.send(`✅ O membro **${member.user.username}** aceitou o convite e agora faz parte do Clan **${clan.clanName}** no servidor **${guild.name}**.`);

          if (!interaction.replied && !interaction.deferred) {
            return await interaction.reply({
              content: `✅ Você aceitou o convite e agora faz parte do Clan **${clan.clanName}** no servidor **${guild.name}**!`,
              flags: 64,
            });
          }
        } catch (error) {
          console.error(`[ERRO] Não foi possível adicionar o cargo ao membro: ${error}`);
          if (!interaction.replied && !interaction.deferred) {
            return await interaction.reply({
              content: "⚠️ Ocorreu um erro ao adicionar você ao Clan. Por favor, tente novamente mais tarde.",
              flags: 64,
            });
          }
        }
      } else {
        if (!interaction.replied && !interaction.deferred) {
          return await interaction.reply({
            content: "⚠️ O cargo do Clan não foi encontrado. Por favor, informe o líder do Clan.",
            flags: 64,
          });
        }
      }
    } else if (interaction.customId.startsWith("decline_clan_invite_")) {
      const [_, guildId, leaderId, memberId] = interaction.customId.split("_"); // Extrair IDs do customId

      // Enviar mensagem de recusa
      return await interaction.reply({
        content: "❌ Você recusou o convite para entrar no Clan.",
        flags: 64,
      });
    } else if (interaction.customId === "edit_members_button") {
      const clan = await Clan.findOne({ leaderId: userId });
      if (!clan) {
        return await interaction.reply({
          content: "⚠️ Você não é líder de nenhum Clan para gerenciar membros.",
          flags: 64,
        });
      }

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("manage_members_menu")
          .setPlaceholder("Selecione uma ação")
          .addOptions([
            {
              label: "Adicionar Membro",
              description: "Adicione um novo membro ao seu Clan.",
              value: "add_member",
            },
            {
              label: "Remover Membro",
              description: "Remova um membro do seu Clan.",
              value: "remove_member",
            },
          ])
      );

      await interaction.reply({
        content: "Selecione uma ação para gerenciar os membros do seu Clan:",
        components: [row],
        flags: 64,
      });
    }
  } else if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "manage_members_menu") {
      const selectedAction = interaction.values[0];
      if (selectedAction === "add_member") {
        const modal = new ModalBuilder()
          .setCustomId("add_member_modal")
          .setTitle("Adicionar Membro ao Clan")
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("member_name_input")
                .setLabel("Nome do Membro")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Digite o nome do membro a ser adicionado")
                .setRequired(true)
            )
          );

        await interaction.showModal(modal);
      } else if (selectedAction === "remove_member") {
        const modal = new ModalBuilder()
          .setCustomId("remove_member_modal")
          .setTitle("Remover Membro do Clan")
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("member_id_input")
                .setLabel("ID do Membro")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Digite o ID do membro a ser removido")
                .setRequired(true)
            )
          );

        await interaction.showModal(modal);
      }
    }
  } else if (interaction.isModalSubmit()) {
    if (interaction.customId === "create_clan_modal") {
      const clanName = interaction.fields.getTextInputValue("clan_name_input");
      const clanTag = interaction.fields.getTextInputValue("clan_tag_input");
      const clanDescription = interaction.fields.getTextInputValue("clan_description_input");

      if (!clanName || !clanTag || !clanDescription) {
        return await interaction.reply({
          content: "⚠️ Todos os campos são obrigatórios para criar um Clan.",
          flags: 64,
        });
      }

      const existingClan = await Clan.findOne({ leaderId: userId });
      if (existingClan) {
        return await interaction.reply({
          content: "⚠️ Você já possui um Clan. Edite ou exclua o existente antes de criar outro.",
          flags: 64,
        });
      }

      const guild = interaction.guild;

      try {
        // Use a função utilitária para criar os recursos do Clan
        const { roleId, textChannelId, voiceChannelId } = await createClanResources(
          guild,
          clanName,
          interaction.user.id
        );

        // Atribuir o cargo ao líder do Clan
        const leader = await guild.members.fetch(interaction.user.id);
        if (leader) {
          await leader.roles.add(roleId);
        }

        const newClan = new Clan({
          leaderId: interaction.user.id,
          clanName,
          clanTag,
          clanDescription,
          members: [interaction.user.id],
          roleId,
          textChannelId,
          voiceChannelId,
        });

        await newClan.save();

        return await interaction.reply({
          content: `✅ Clan **${clanName}** criado com sucesso! Um canal, um cargo e um canal de voz foram criados. O cargo foi atribuído a você.`,
          flags: 64,
        });
      } catch (error) {
        console.error("Erro ao criar o canal ou cargo do Clan:", error);
        return await interaction.reply({
          content: "⚠️ Ocorreu um erro ao criar o canal ou cargo do Clan.",
          flags: 64,
        });
      }
    }

    if (interaction.customId === "add_member_modal") {
      const memberInput = interaction.fields.getTextInputValue("member_name_input"); // Entrada do usuário
      const clan = await Clan.findOne({ leaderId: userId });

      if (!clan) {
        return await interaction.reply({
          content: "⚠️ Você não é líder de nenhum Clan para adicionar membros.",
          flags: 64,
        });
      }

      if (!Array.isArray(clan.members)) {
        clan.members = [];
      }

      try {
        const guild = interaction.guild;
        const role = guild.roles.cache.get(clan.roleId);

        if (!role) {
          return await interaction.reply({
            content: "⚠️ O cargo do Clan não foi encontrado.",
            flags: 64,
          });
        }

        // Buscar membro pelo ID, nome de usuário ou nome de exibição
        const member = await guild.members.fetch({ query: memberInput, limit: 1 }).then((members) => {
          return (
            members.get(memberInput) || // Buscar por ID
            members.find((m) => m.user.username === memberInput) || // Buscar por nome de usuário
            members.find((m) => m.displayName === memberInput) // Buscar por nome de exibição
          );
        });

        if (!member) {
          return await interaction.reply({
            content: "⚠️ Membro não encontrado no servidor. Certifique-se de usar o ID, nome de usuário ou nome de exibição correto.",
            flags: 64,
          });
        }

        if (clan.members.includes(member.id)) {
          return await interaction.reply({
            content: "⚠️ Este membro já faz parte do seu Clan.",
            flags: 64,
          });
        }

        // Criar botão de "Aceitar" e "Recusar"
        const customId = `accept_clan_invite_${interaction.guild.id}_${interaction.user.id}_${member.id}`;
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(customId) // Inclui o ID do servidor, líder e membro
            .setLabel("Aceitar")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`decline_clan_invite_${interaction.guild.id}_${interaction.user.id}_${member.id}`)
            .setLabel("Recusar")
            .setStyle(ButtonStyle.Danger)
        );

        // Criar embed para a mensagem na DM
        const embed = new EmbedBuilder()
          .setTitle("📢 Convite para entrar no Clan!")
          .setColor(0x3498db) // Azul
          .setDescription(`Você foi convidado para o Clan **${clan.clanName}** no servidor **${guild.name}**.`)
          .addFields(
            { name: "Clan", value: clan.clanName, inline: true },
            { name: "Servidor", value: guild.name, inline: true },
            { name: "Descrição", value: clan.clanDescription || "Sem descrição.", inline: false }
          )
          .setTimestamp();

        // Enviar mensagem na DM do membro
        await member.send({
          content: "Clique em um dos botões abaixo para aceitar ou recusar o convite.",
          embeds: [embed],
          components: [row],
        });

        // Salvar o convite no arquivo invites.json
        const invites = loadInvites();
        invites.set(customId, { guildId: interaction.guild.id, leaderId: interaction.user.id, memberId: member.id });
        saveInvites(invites);

        return await interaction.reply({
          content: `✅ Convite enviado para o membro **${member.user.username}** na DM.`,
          flags: 64,
        });
      } catch (error) {
        console.error("Erro ao adicionar membro ao Clan:", error);
        return await interaction.reply({
          content: "⚠️ Ocorreu um erro ao adicionar o membro ao Clan.",
          flags: 64,
        });
      }
    } else if (interaction.customId === "edit_clan_modal") {
      try {
        // Deferir a resposta para evitar expiração
        if (!interaction.deferred && !interaction.replied) {
          await interaction.deferReply({ ephemeral: true });
        }

        let clanName = interaction.fields.getTextInputValue("clan_name_input");
        let clanTag = interaction.fields.getTextInputValue("clan_tag_input");
        let clanDescription = interaction.fields.getTextInputValue("clan_description_input");

        const clan = await Clan.findOne({ leaderId: userId });
        if (!clan) {
          return await interaction.editReply({
            content: "⚠️ Ocorreu um erro ao editar o Clan. Clan não encontrado.",
          });
        }

        const guild = interaction.guild;

        // Atualizar os recursos do Clan usando a função utilitária
        await updateClanResources(guild, clan);

        // Atualizar os dados do clan
        clan.clanName = clanName;
        clan.clanTag = clanTag;
        clan.clanDescription = clanDescription;
        await clan.save();

        await interaction.editReply({
          content: `✅ Clan **${clanName}** editado com sucesso! O nome do canal de texto, canal de voz e do cargo foram atualizados.`,
        });
      } catch (error) {
        console.error("Erro ao atualizar os recursos do Clan:", error);
        if (!interaction.replied) {
          await interaction.editReply({
            content: "⚠️ Ocorreu um erro ao atualizar os recursos do Clan.",
          });
        }
      }
    } else if (interaction.customId === "delete_clan_modal") {
      const userId = interaction.user.id;

      // Verificar se o Clan existe no banco de dados
      const clan = await Clan.findOne({ leaderId: userId });

      if (!clan) {
        return await interaction.reply({
          content: "⚠️ Ocorreu um erro ao excluir o Clan. Clan não encontrado no banco de dados.",
          flags: 64,
        });
      }

      try {
        const guild = interaction.guild;

        // Excluir o canal de texto
        const textChannel = guild.channels.cache.get(clan.textChannelId);
        if (textChannel) {
          await textChannel.delete().catch((error) => {
            console.error(`[ERRO] Não foi possível excluir o canal de texto: ${error}`);
          });
        }

        // Excluir o canal de voz
        const voiceChannel = guild.channels.cache.get(clan.voiceChannelId);
        if (voiceChannel) {
          await voiceChannel.delete().catch((error) => {
            console.error(`[ERRO] Não foi possível excluir o canal de voz: ${error}`);
          });
        }

        // Excluir o cargo
        const role = guild.roles.cache.get(clan.roleId);
        if (role) {
          await role.delete().catch((error) => {
            console.error(`[ERRO] Não foi possível excluir o cargo: ${error}`);
          });
        }

        // Salvar o Clan deletado no banco de dados (opcional)
        await DeletedClan.create({
          clanName: clan.clanName,
          clanTag: clan.clanTag,
          clanDescription: clan.clanDescription,
          members: clan.members,
          leaderId: clan.leaderId,
          roleId: clan.roleId,
          textChannelId: clan.textChannelId,
          voiceChannelId: clan.voiceChannelId,
          points: clan.points,
          coins: clan.coins,
          creationDate: clan.creationDate,
          deletedAt: new Date(),
        });

        // Remover o Clan do banco de dados
        await Clan.deleteOne({ leaderId: userId });

        return await interaction.reply({
          content: "✅ Seu Clan foi excluído com sucesso! Todos os recursos associados foram removidos.",
          flags: 64,
        });
      } catch (error) {
        console.error("Erro ao excluir os recursos do Clan:", error);
        return await interaction.reply({
          content: "⚠️ Ocorreu um erro ao excluir os recursos do Clan.",
          flags: 64,
        });
      }
    } else if (interaction.customId === "remove_member_modal") {
      const memberInput = interaction.fields.getTextInputValue("member_id_input"); // Entrada do usuário
      const clan = await Clan.findOne({ leaderId: userId });

      if (!clan) {
        return await interaction.reply({
          content: "⚠️ Você não é líder de nenhum Clan para remover membros.",
          flags: 64,
        });
      }

      if (!Array.isArray(clan.members)) {
        clan.members = [];
      }

      try {
        const guild = interaction.guild;

        // Buscar membro pelo ID, nome de usuário ou nome de exibição
        const member = await guild.members.fetch({ query: memberInput, limit: 1 }).then((members) => {
          return (
            members.get(memberInput) || // Buscar por ID
            members.find((m) => m.user.username === memberInput) || // Buscar por nome de usuário
            members.find((m) => m.displayName === memberInput) // Buscar por nome de exibição
          );
        });

        if (!member) {
          return await interaction.reply({
            content: "⚠️ Membro não encontrado no servidor. Certifique-se de usar o ID, nome de usuário ou nome de exibição correto.",
            flags: 64,
          });
        }

        // Verificar se o membro a ser removido é o líder
        if (member.id === clan.leaderId) {
          return await interaction.reply({
            content: "⚠️ O líder do Clan não pode ser removido dos membros.",
            flags: 64,
          });
        }

        if (!clan.members.includes(member.id)) {
          return await interaction.reply({
            content: "⚠️ Este membro não faz parte do seu Clan.",
            flags: 64,
          });
        }

        const role = guild.roles.cache.get(clan.roleId);

        if (!role) {
          return await interaction.reply({
            content: "⚠️ O cargo do Clan não foi encontrado.",
            flags: 64,
          });
        }

        // Remover o cargo do membro
        await member.roles.remove(role);
        clan.members = clan.members.filter((id) => id !== member.id);
        await clan.save();

        // Enviar DM para o membro informando que ele foi removido
        await member.send(`⚠️ Você foi removido do Clan **${clan.clanName}**.`);

        return await interaction.reply({
          content: `✅ O membro **${member.user.username}** foi removido do Clan **${clan.clanName}** com sucesso!`,
          flags: 64,
        });
      } catch (error) {
        console.error("Erro ao remover membro do Clan:", error);
        return await interaction.reply({
          content: "⚠️ Ocorreu um erro ao remover o membro do Clan.",
          flags: 64,
        });
      }
    }
  }
};

const row = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId("create_clan_button")
    .setLabel("Criar Clan")
    .setStyle(ButtonStyle.Secondary), // Set to black
  new ButtonBuilder()
    .setCustomId("edit_clan_button")
    .setLabel("Editar Clan")
    .setStyle(ButtonStyle.Secondary), // Set to black
  new ButtonBuilder()
    .setCustomId("delete_clan_button")
    .setLabel("Excluir Clan")
    .setStyle(ButtonStyle.Secondary), // Set to black
  new ButtonBuilder()
    .setCustomId("edit_members_button")
    .setLabel("Editar Membros")
    .setStyle(ButtonStyle.Secondary) // Set to black
);

export const handleInteractionCreate = async (interaction, client) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.log(`[LOG] Comando não encontrado: ${interaction.commandName}`);
    return;
  }

  try {
    console.log(`[LOG] Executando comando: ${interaction.commandName}`);
    await command.execute(interaction, null, client);
  } catch (error) {
    console.error("Erro ao executar o comando:", error);
    if (!interaction.replied) {
      await interaction.reply({
        content: "⚠️ Ocorreu um erro ao executar este comando.",
        flags: 64,
      });
    }
  }
};