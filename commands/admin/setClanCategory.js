import fs from "fs";
import path from "path";

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

  // Atualizar o arquivo channels.json
  const channelsFilePath = path.resolve("data", "channels.json");
  let channelsConfig = {};

  if (fs.existsSync(channelsFilePath)) {
    channelsConfig = JSON.parse(fs.readFileSync(channelsFilePath, "utf8"));
  }

  channelsConfig.Clan_category = categoryId;

  try {
    fs.writeFileSync(channelsFilePath, JSON.stringify(channelsConfig, null, 2));
    return await interaction.reply({
      content: `✅ Categoria definida com sucesso! Os canais do Clan serão criados na categoria **${category.name}**.`,
      flags: 64,
    });
  } catch (error) {
    console.error("[ERRO] Não foi possível salvar o arquivo channels.json:", error);
    return await interaction.reply({
      content: "⚠️ Ocorreu um erro ao salvar a configuração da categoria.",
      flags: 64,
    });
  }
};