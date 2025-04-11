import fs from "fs";
import path from "path";

const clansFilePath = path.resolve("data", "clans.json");
const channelsFilePath = path.resolve("data", "channels.json");
const deletedClansFilePath = path.resolve("data", "deletedClans.json");

export const loadClans = () => {
  if (fs.existsSync(clansFilePath)) {
    try {
      const data = fs.readFileSync(clansFilePath, "utf-8");
      return new Map(Object.entries(JSON.parse(data || "{}")));
    } catch (error) {
      console.error("[ERRO] Não foi possível carregar o arquivo clans.json:", error);
      return new Map();
    }
  }
  return new Map();
};

export const saveClans = (clans) => {
  if (!(clans instanceof Map)) {
    console.error("[ERRO] O objeto 'clans' não é um Map válido.");
    return;
  }
  try {
    fs.writeFileSync(clansFilePath, JSON.stringify(Object.fromEntries(clans), null, 2));
  } catch (error) {
    console.error("[ERRO] Não foi possível salvar o arquivo clans.json:", error);
  }
};

export const getCategoryChannelId = () => {
  if (fs.existsSync(channelsFilePath)) {
    const data = JSON.parse(fs.readFileSync(channelsFilePath, "utf-8"));
    return data.Clan_category || null;
  }
  return null;
};

export const getClanByLeaderId = (leaderId) => {
  const clans = loadClans();
  for (const [id, clan] of clans.entries()) {
    if (clan.leaderId === leaderId) {
      return clan;
    }
  }
  return null;
};

export const getPendingInvite = (userId) => {
  const clans = loadClans();
  return clans.get(userId)?.pendingInvite || null;
};

/**
 * Creates a role, text channel, and voice channel for a clan.
 * @param {Object} guild - The Discord guild (server).
 * @param {string} clanName - The name of the clan.
 * @param {string} leaderId - The ID of the clan leader.
 * @returns {Object} An object containing the role, text channel, and voice channel IDs.
 */
export const createClanResources = async (guild, clanName, leaderId) => {
  const formattedName = `《👥》${clanName}`;

  // Carregar o ID da categoria do arquivo channels.json
  const channelsConfigPath = path.resolve("data", "channels.json");
  const channelsConfig = JSON.parse(fs.readFileSync(channelsConfigPath, "utf8"));
  const categoryId = channelsConfig.Clan_category;

  if (!categoryId) {
    throw new Error("ID da categoria do Clan não encontrado em channels.json.");
  }

  try {
    // Criar o cargo do Clan
    const role = await guild.roles.create({
      name: formattedName,
      mentionable: true,
      reason: `Cargo criado para o Clan ${clanName}`,
    });

    // Criar o canal de texto do Clan
    const textChannel = await guild.channels.create({
      name: formattedName,
      type: 0, // Canal de texto
      parent: categoryId, // Definir a categoria
      reason: `Canal de texto criado para o Clan ${clanName}`,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: ['ViewChannel'],
        },
        {
          id: role.id,
          allow: ['ViewChannel', 'SendMessages'],
        },
      ],
    });

    // Criar o canal de voz do Clan
    const voiceChannel = await guild.channels.create({
      name: formattedName,
      type: 2, // Canal de voz
      parent: categoryId, // Definir a categoria
      reason: `Canal de voz criado para o Clan ${clanName}`,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: ['ViewChannel'],
        },
        {
          id: role.id,
          allow: ['ViewChannel', 'Connect', 'Speak'],
        },
      ],
    });

    return {
      roleId: role.id,
      textChannelId: textChannel.id,
      voiceChannelId: voiceChannel.id,
    };
  } catch (error) {
    console.error(`[ERRO] Falha ao criar recursos do Clan ${clanName}:`, error);
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

export const restoreDeletedClan = (clanName) => {
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
    const clans = loadClans();
    clans.set(clan.leaderId, clan);
    saveClans(clans);

    fs.writeFileSync(deletedClansFilePath, JSON.stringify(deletedClans, null, 2));
    console.log(`[LOG] Clan "${clanName}" restaurado com sucesso para clans.json.`);
    return true;
  } catch (error) {
    console.error(`[ERRO] Não foi possível restaurar o Clan "${clanName}":`, error);
    return false;
  }
};

export function saveMemberJoinDate(clans, clanId, memberId) {
  const clan = clans.get(clanId);
  if (!clan) return;

  if (!clan.joinDates) {
    clan.joinDates = {};
  }

  if (!clan.joinDates[memberId]) {
    clan.joinDates[memberId] = new Date().toISOString();
  }

  saveClans(clans);
}

export const updateClanVoiceChannelName = async (guild, clan) => {
  const formattedName = `《👥》${clan.clanName}`;

  // Atualizar o nome do canal de voz
  const voiceChannel = guild.channels.cache.get(clan.voiceChannelId);
  if (voiceChannel) {
    await voiceChannel.setName(formattedName);
  }
};