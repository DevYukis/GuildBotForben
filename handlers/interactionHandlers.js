import { createClanModal, editClanModal, deleteClanModal } from "../utils/modalBuilders.js";
import { loadClans, saveClans, getCategoryChannelId, createClanResources, deleteClanResources, saveMemberJoinDate } from "../utils/clanUtils.js";
import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

const clans = loadClans();

export const handleInteraction = async (interaction) => {
  // Verifica se a interação é válida
  if (!interaction || typeof interaction.isButton !== "function") {
    console.warn("Interação ignorada: tipo não suportado ou inválido.");
    return;
  }

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
      if (clans.has(userId)) {
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
      if (!clans.has(userId)) {
        return await interaction.reply({
          content: "⚠️ Você não é dono de nenhum Clan para editar.",
          flags: 64,
        });
      }

      const clan = clans.get(userId);

      if (!clan || !clan.clanName || !clan.clanTag || !clan.clanDescription) {
        return await interaction.reply({
          content: "⚠️ O Clan não possui informações válidas para edição.",
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
      if (!clans.has(userId)) {
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
      const inviterId = interaction.customId.split("_").pop();
      const clan = clans.get(inviterId);

      if (!clan) {
        return await interaction.reply({
          content: "⚠️ O Clan não existe mais.",
          flags: 64,
        });
      }

      if (!Array.isArray(clan.members)) {
        clan.members = [];
      }

      clan.members.push(interaction.user.id);
      saveMemberJoinDate(clans, inviterId, interaction.user.id); // Save join date
      saveClans(clans);

      const guild = interaction.guild;
      const role = guild.roles.cache.get(clan.roleId);

      if (role) {
        for (const memberId of clan.members) {
          const member = await guild.members.fetch(memberId).catch(() => null);
          if (member) {
            await member.roles.add(role).catch((error) => {
              console.error(`[ERRO] Não foi possível adicionar o cargo ao membro ${memberId}: ${error}`);
            });
          }
        }
      }

      return await interaction.reply({
        content: `✅ Você entrou no Clan **${clan.clanName}**!`,
        flags: 64,
      });
    } else if (interaction.customId === "edit_members_button") {
      const clan = Array.from(clans.values()).find((clan) => clan.leaderId === userId);
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
                .setCustomId("member_id_input")
                .setLabel("ID do Membro")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Digite o ID do membro a ser adicionado")
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

      if (clans.has(interaction.user.id)) {
        return await interaction.reply({
          content: "⚠️ Você já possui um Clan. Edite ou exclua o existente antes de criar outro.",
          flags: 64,
        });
      }

      const guild = interaction.guild;

      try {
        // Use the utility function to create the role and channel
        const { roleId, channelId } = await createClanResources(guild, clanName, interaction.user.id);

        const newClan = {
          leaderId: interaction.user.id,
          clanName,
          clanTag,
          clanDescription,
          members: [interaction.user.id],
          roleId,
          channelId,
        };

        clans.set(interaction.user.id, newClan);
        saveClans(clans);

        return await interaction.reply({
          content: `✅ Clan **${clanName}** criado com sucesso! Um canal e um cargo foram criados.`,
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
      const memberId = interaction.fields.getTextInputValue("member_id_input");
      const clan = Array.from(clans.values()).find((clan) => clan.leaderId === userId);

      if (!clan) {
        return await interaction.reply({
          content: "⚠️ Você não é líder de nenhum Clan para adicionar membros.",
          flags: 64,
        });
      }

      if (!Array.isArray(clan.members)) {
        clan.members = [];
      }

      if (clan.members.includes(memberId)) {
        return await interaction.reply({
          content: "⚠️ Este membro já faz parte do seu Clan.",
          flags: 64,
        });
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

        const member = await guild.members.fetch(memberId);
        if (!member) {
          return await interaction.reply({
            content: "⚠️ Membro não encontrado no servidor.",
            flags: 64,
          });
        }

        await member.roles.add(role);
        clan.members.push(memberId);
        saveClans(clans);

        const embed = {
          color: 0x800080, // Purple color
          title: "Você foi adicionado a um Clan!",
          description: `✅ Você agora faz parte do Clan **${clan.clanName}**!`,
          fields: [
            { name: "Clan", value: clan.clanName, inline: true },
            { name: "Servidor", value: guild.name, inline: true },
          ],
          timestamp: new Date(),
        };

        await member.send({ embeds: [embed] });

        return await interaction.reply({
          content: `✅ O membro foi adicionado ao Clan **${clan.clanName}** com sucesso!`,
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

        const clan = clans.get(userId);
        if (!clan) {
          return await interaction.editReply({
            content: "⚠️ Ocorreu um erro ao editar o Clan. Clan não encontrado.",
          });
        }

        const guild = interaction.guild;
        const formattedName = `《👥》${clanName}`;

        // Atualizar o nome do cargo
        const role = guild.roles.cache.get(clan.roleId);
        if (role) {
          await role.setName(formattedName);
        }

        // Atualizar o nome do canal
        const channel = guild.channels.cache.get(clan.channelId);
        if (channel) {
          await channel.setName(formattedName);
        }

        // Atualizar os dados do clan
        clan.clanName = clanName;
        clan.clanTag = clanTag;
        clan.clanDescription = clanDescription;
        saveClans(clans);

        await interaction.editReply({
          content: `✅ Clan **${clanName}** editado com sucesso! O nome do canal e do cargo foram atualizados.`,
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
      if (!clans.has(userId)) {
        return await interaction.reply({
          content: "⚠️ Ocorreu um erro ao excluir o Clan. Clan não encontrado.",
          flags: 64,
        });
      }

      const clan = clans.get(userId);

      try {
        // Ensure the deleteClanResources function deletes the clan's chat and role
        await deleteClanResources(interaction.guild, clan.clanName);

        // Schedule deletion of clan data
        clans.delete(userId);
        saveClans(clans);

        return await interaction.reply({
          content: "✅ Seu Clan foi excluído com sucesso!",
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
      const memberId = interaction.fields.getTextInputValue("member_id_input");
      const clan = Array.from(clans.values()).find((clan) => clan.leaderId === userId);

      if (!clan) {
        return await interaction.reply({
          content: "⚠️ Você não é líder de nenhum Clan para remover membros.",
          flags: 64,
        });
      }

      if (!Array.isArray(clan.members) || !clan.members.includes(memberId)) {
        return await interaction.reply({
          content: "⚠️ Este membro não faz parte do seu Clan.",
          flags: 64,
        });
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

        const member = await guild.members.fetch(memberId).catch(() => null);
        if (!member) {
          return await interaction.reply({
            content: "⚠️ Membro não encontrado no servidor.",
            flags: 64,
          });
        }

        await member.roles.remove(role);
        clan.members = clan.members.filter((id) => id !== memberId);
        saveClans(clans);

        await member.send(`⚠️ Você foi removido do Clan **${clan.clanName}**.`);

        return await interaction.reply({
          content: `✅ O membro foi removido do Clan **${clan.clanName}** com sucesso!`,
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