import fs from "fs";
import path from "path";
import Clan from "../models/Clan.js";
import ChannelConfig from "../models/ChannelConfig.js"; // Modelo para configurações de canais

const deletedClansFilePath = path.resolve("data", "deletedClans.json");

export const loadClans = async () => {
  const clans = await Clan.find(); // Busca todos os Clans do banco de dados
  return new Map(clans.map((clan) => [clan.leaderId, clan.toObject()])); // Converte para Map
};

export const saveClans = async (clans) => {
  for (const [leaderId, clanData] of clans.entries()) {
    await Clan.findOneAndUpdate({ leaderId }, clanData, { upsert: true });
  }
};

/**
 * Obtém o ID da categoria de Clans do banco de dados.
 * @param {string} serverId - O ID do servidor.
 * @returns {string|null} O ID da categoria ou null se não estiver configurado.
 */
export const getCategoryChannelId = async (serverId) => {
  try {
    const config = await ChannelConfig.findOne({ serverId });
    return config?.clanCategoryId || null;
  } catch (error) {
    console.error(`[ERRO] Não foi possível carregar a categoria de Clans do banco de dados: ${error}`);
    return null;
  }
};

/**
 * Salva o ID da categoria de Clans no banco de dados.
 * @param {string} serverId - O ID do servidor.
 * @param {string} categoryId - O ID da categoria.
 */
export const saveCategoryChannelId = async (serverId, categoryId) => {
  try {
    await ChannelConfig.findOneAndUpdate(
      { serverId },
      { $set: { clanCategoryId: categoryId } },
      { upsert: true }
    );
    console.log(`[LOG] Categoria de Clans salva no banco de dados para o servidor ${serverId}.`);
  } catch (error) {
    console.error(`[ERRO] Não foi possível salvar a categoria de Clans no banco de dados: ${error}`);
  }
};

export const getClanByLeaderId = async (leaderId) => {
  const clans = await loadClans();
  for (const [id, clan] of clans.entries()) {
    if (clan.leaderId === leaderId) {
      return clan;
    }
  }
  return null;
};

export const getPendingInvite = async (userId) => {
  const clans = await loadClans();
  return clans.get(userId)?.pendingInvite || null;
};

/**
 * Cria os recursos de um Clan (cargo, canal de texto e canal de voz).
 * @param {Object} guild - O servidor Discord.
 * @param {string} clanName - O nome do Clan.
 * @param {string} leaderId - O ID do líder do Clan.
 * @returns {Object} IDs dos recursos criados.
 */
export const createClanResources = async (guild, clanName, leaderId) => {
  try {
    // Buscar o ID da categoria do Clan no banco de dados
    const channelConfig = await ChannelConfig.findOne({ serverId: guild.id });
    if (!channelConfig || !channelConfig.clanCategoryId) {
      throw new Error("ID da categoria do Clan não encontrado no banco de dados.");
    }

    const clanCategoryId = channelConfig.clanCategoryId;

    // Buscar a categoria no servidor
    const clanCategory = guild.channels.cache.get(clanCategoryId);
    if (!clanCategory) {
      throw new Error("Categoria do Clan não encontrada no servidor.");
    }

    // Criar o cargo do Clan
    const role = await guild.roles.create({
      name: `Clan ${clanName}`,
      mentionable: true,
    });

    // Criar o canal de texto do Clan
    const textChannel = await guild.channels.create({
      name: `《👥》${clanName.toLowerCase()}`,
      type: 0, // Canal de texto
      parent: clanCategory.id,
      permissionOverwrites: [
        {
          id: guild.id, // Todos os membros
          deny: ["ViewChannel"],
        },
        {
          id: role.id, // Membros do Clan
          allow: ["ViewChannel"],
        },
      ],
    });

    // Criar o canal de voz do Clan
    const voiceChannel = await guild.channels.create({
      name: `《👥》${clanName}`,
      type: 2, // Canal de voz
      parent: clanCategory.id,
      permissionOverwrites: [
        {
          id: guild.id, // Todos os membros
          deny: ["ViewChannel"],
        },
        {
          id: role.id, // Membros do Clan
          allow: ["ViewChannel"],
        },
      ],
    });

    return {
      roleId: role.id,
      textChannelId: textChannel.id,
      voiceChannelId: voiceChannel.id,
    };
  } catch (error) {
    console.error("Erro ao criar os recursos do Clan:", error);
    throw error;
  }
};

export const deleteClanResources = async (guild, clanName) => {
  const formattedName = `《👥》${clanName}`;

  try {
    // Excluir o cargo do Clan
    const role = guild.roles.cache.find((r) => r.name === formattedName);
    if (role) {
      await role.delete(`Cargo do Clan ${clanName} excluído.`);
    }

    // Excluir o canal de texto do Clan
    const textChannel = guild.channels.cache.find(
      (c) => c.name === formattedName && c.type === 0 // 0 = Canal de texto
    );
    if (textChannel) {
      await textChannel.delete(`Canal de texto do Clan ${clanName} excluído.`);
    }

    // Excluir o canal de voz do Clan
    const voiceChannel = guild.channels.cache.find(
      (c) => c.name === formattedName && c.type === 2 // 2 = Canal de voz
    );
    if (voiceChannel) {
      await voiceChannel.delete(`Canal de voz do Clan ${clanName} excluído.`);
    }
  } catch (error) {
    console.error(`[ERRO] Falha ao excluir recursos do Clan ${clanName}:`, error);
    throw error;
  }
};

export const restoreDeletedClan = async (clanName) => {
  try {
    if (!fs.existsSync(deletedClansFilePath)) {
      console.warn("[WARN] O arquivo deletedClans.json não existe.");
      return false;
    }

    const deletedClans = JSON.parse(fs.readFileSync(deletedClansFilePath, "utf-8") || "[]");
    const clanIndex = deletedClans.findIndex((clan) => clan.clanName.toLowerCase() === clanName.toLowerCase());

    if (clanIndex === -1) {
      console.warn(`[WARN] Clan "${clanName}" não encontrado em deletedClans.json.`);
      return false;
    }

    const clan = deletedClans.splice(clanIndex, 1)[0];
    const clans = await loadClans();
    clans.set(clan.leaderId, clan);
    await saveClans(clans);

    fs.writeFileSync(deletedClansFilePath, JSON.stringify(deletedClans, null, 2));
    console.log(`[LOG] Clan "${clanName}" restaurado com sucesso para clans.json.`);
    return true;
  } catch (error) {
    console.error(`[ERRO] Não foi possível restaurar o Clan "${clanName}":`, error);
    return false;
  }
};

export async function saveMemberJoinDate(clans, clanId, memberId) {
  const clan = clans.get(clanId);
  if (!clan) return;

  if (!clan.joinDates) {
    clan.joinDates = {};
  }

  if (!clan.joinDates[memberId]) {
    clan.joinDates[memberId] = new Date().toISOString();
  }

  await saveClans(clans);
}

export const updateClanVoiceChannelName = async (guild, clan) => {
  const formattedName = `《👥》${clan.clanName}`;

  // Atualizar o nome do canal de voz
  const voiceChannel = guild.channels.cache.get(clan.voiceChannelId);
  if (voiceChannel) {
    await voiceChannel.setName(formattedName);
  }
};