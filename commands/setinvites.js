import fs from "fs";
import path from "path";

// Caminho para o arquivo channels.json
const channelsFilePath = path.resolve("data", "channels.json");

// Função para salvar o ID do canal no arquivo channels.json
const saveInviteChannelId = (channelId) => {
  let data = {};
  if (fs.existsSync(channelsFilePath)) {
    data = JSON.parse(fs.readFileSync(channelsFilePath, "utf-8"));
  }
  data.Invite_chat = channelId;
  fs.writeFileSync(channelsFilePath, JSON.stringify(data, null, 2));
  console.log(`[LOG] Canal de convites atualizado para o ID: ${channelId}`);
};

// Comando para definir o canal de convites
export default {
  name: "setinvites",
  description: "Define o canal onde os convites serão enviados.",
  async execute(message, args) {
    // Verifica se o autor do comando tem permissão para gerenciar o servidor
    if (!message.member.permissions.has("ManageGuild")) {
      return message.reply("⚠️ Você não tem permissão para usar este comando.");
    }

    // Obtém o canal mencionado ou o canal atual
    const channel = message.mentions.channels.first() || message.channel;

    // Salva o ID do canal no arquivo channels.json
    saveInviteChannelId(channel.id);

    // Responde ao usuário
    message.reply(`✅ O canal de convites foi definido para <#${channel.id}>.`);
  },
};