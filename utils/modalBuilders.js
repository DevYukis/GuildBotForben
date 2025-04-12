import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";

export const createClanModal = () => {
  return new ModalBuilder()
    .setCustomId("create_clan_modal")
    .setTitle("Criar Novo Clan")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("clan_name_input") // Ensure this matches the expected ID
          .setLabel("Nome do Clan")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Digite o nome do Clan")
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("clan_tag_input") // Ensure this matches the expected ID
          .setLabel("Tag do Clan")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Digite a tag do Clan")
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("clan_description_input") // Ensure this matches the expected ID
          .setLabel("Descrição do Clan")
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder("Digite uma descrição para o Clan")
          .setRequired(true)
      )
    );
};

export const editClanModal = (clan) => {
  if (!clan || !clan.clanName || !clan.clanTag || !clan.clanDescription) {
    console.error("Dados do Clan inválidos para criar o modal de edição.");
    return null;
  }

  return new ModalBuilder()
    .setCustomId("edit_clan_modal")
    .setTitle("Editar Clan")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("clan_name_input")
          .setLabel("Nome do Clan")
          .setStyle(TextInputStyle.Short)
          .setValue(clan.clanName)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("clan_tag_input")
          .setLabel("Tag do Clan")
          .setStyle(TextInputStyle.Short)
          .setValue(clan.clanTag)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("clan_description_input")
          .setLabel("Descrição do Clan")
          .setStyle(TextInputStyle.Paragraph)
          .setValue(clan.clanDescription)
          .setRequired(true)
      )
    );
};

export const deleteClanModal = () => {
  const modal = new ModalBuilder().setCustomId("delete_clan_modal").setTitle("Excluir Clan");

  const confirmInput = new TextInputBuilder()
    .setCustomId("confirm_delete")
    .setLabel('Digite "CONFIRMAR" para excluir seu Clan')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  return modal.addComponents(new ActionRowBuilder().addComponents(confirmInput));
};

export const removeMemberModal = () => {
  return new ModalBuilder()
    .setCustomId("remove_member_modal")
    .setTitle("Remover Membro do Clan")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("member_id_input") // Input for member ID
          .setLabel("ID do Membro")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Digite o ID do membro a ser removido")
          .setRequired(true)
      )
    );
};