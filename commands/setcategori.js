import fs from "fs";
import path from "path";

// Caminho para o arquivo channels.json
const channelsFilePath = path.resolve("data", "channels.json");

// Função para salvar o ID da categoria no arquivo channels.json
const saveCategoryChannelId = (categoryId) => {
  let data = {};
  if (fs.existsSync(channelsFilePath)) {
    data = JSON.parse(fs.readFileSync(channelsFilePath, "utf-8"));
  }
  data.Clan_category = categoryId;
  fs.writeFileSync(channelsFilePath, JSON.stringify(data, null, 2));
  console.log(`[LOG] Categoria de Clans atualizada para o ID: ${categoryId}`);
};

// Comando para definir a categoria de Clans
export default {
  name: "setcategori",
  description: "Define a categoria onde os canais dos Clans serão criados.",
  async execute(message, args) {
    // Verifica se o autor do comando tem permissão para gerenciar o servidor
    if (!message.member.permissions.has("ManageGuild")) {
      return message.reply("⚠️ Você não tem permissão para usar este comando.");
    }

    // Obtém a categoria mencionada ou a categoria do canal atual
    const category = message.mentions.channels.first() || message.channel.parent;

    if (!category || category.type !== 4) { // Verifica se é uma categoria
      return message.reply("⚠️ Por favor, mencione uma categoria válida ou use este comando em um canal dentro da categoria desejada.");
    }

    // Salva o ID da categoria no arquivo channels.json
    saveCategoryChannelId(category.id);

    // Responde ao usuário
    message.reply(`✅ A categoria de Clans foi definida para **${category.name}**.`);
  },
};