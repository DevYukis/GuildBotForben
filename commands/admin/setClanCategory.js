import fs from "fs";
import path from "path";
import { saveChannelConfig } from "../../utils/channelUtils.js";

export const setClanCategory = async (interaction) => {
  if (!interaction.member.permissions.has("Administrator")) {
    return await interaction.reply({
      content: "⚠️ Você não tem permissão para usar este comando.",
      flags: 64,
    });
  }

  const categoryId = interaction.options.getString("category_id");

  // Verificar se a categoria existe no servidor
  const category = interaction.guild.channels.cache.get(categoryId);
  if (!category || category.type !== 4) { // 4 = Categoria
    return await interaction.reply({
      content: "⚠️ O ID fornecido não corresponde a uma categoria válida no servidor.",
      flags: 64,
    });
  }

  try {
    // Salvar a categoria no banco de dados
    const serverId = interaction.guild.id;
    await saveChannelConfig(serverId, { clanCategoryId: categoryId });

    return await interaction.reply({
      content: `✅ Categoria definida com sucesso! Os canais do Clan serão criados na categoria **${category.name}**.`,
      flags: 64,
    });
  } catch (error) {
    console.error("[ERRO] Não foi possível salvar a configuração da categoria no banco de dados:", error);
    return await interaction.reply({
      content: "⚠️ Ocorreu um erro ao salvar a configuração da categoria no banco de dados.",
      flags: 64,
    });
  }
};