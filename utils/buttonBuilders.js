import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export const createClanButtons = () => {
  return new ActionRowBuilder().addComponents(
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
      .setCustomId("remove_member_button")
      .setLabel("Remover Membro")
      .setStyle(ButtonStyle.Secondary)
  );
};
