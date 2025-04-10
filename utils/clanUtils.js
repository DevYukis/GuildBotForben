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
 * Creates a role and a channel for a clan.
 * @param {Object} guild - The Discord guild (server).
 * @param {string} clanName - The name of the clan.
 * @param {string} leaderId - The ID of the clan leader.
 * @returns {Object} An object containing the role and channel IDs.
 */
export const createClanResources = async (guild, clanName, leaderId) => {
  try {
    // Create a role for the clan
    const role = await guild.roles.create({
      name: `Clan ${clanName}`,
      color: "#3498db",
      mentionable: true,
      reason: `Role criado para o Clan ${clanName}`,
    });

    // Assign the role to the clan leader
    const leader = await guild.members.fetch(leaderId);
    if (leader) {
      await leader.roles.add(role, `Líder do Clan ${clanName} recebeu o cargo.`);
    }

    // Get the category channel ID for clans
    const categoryChannelId = getCategoryChannelId();
    const parent = categoryChannelId ? guild.channels.cache.get(categoryChannelId) : null;

    // Create a text channel for the clan
    const channel = await guild.channels.create({
      name: `《👥》${clanName}`, // Set the channel name format
      type: 0, // GuildText
      parent: parent?.id || null,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: ["ViewChannel"], // Deny access to everyone
        },
        {
          id: role.id,
          allow: ["ViewChannel", "SendMessages"], // Allow clan members to view and send messages
        },
        {
          id: leaderId,
          allow: ["ManageChannels", "ManageRoles", "SendMessages"], // Grant leader additional permissions
        },
      ],
      reason: `Canal criado para o Clan ${clanName}`,
    });

    return { roleId: role.id, channelId: channel.id };
  } catch (error) {
    console.error("Erro ao criar os recursos do Clan:", error);
    throw new Error("Erro ao criar os recursos do Clan.");
  }
};

// Temporarily disable saveDeletedClan
// const saveDeletedClan = (clan) => {
//   try {
//     let deletedClans = [];
//     if (fs.existsSync(deletedClansFilePath)) {
//       const data = fs.readFileSync(deletedClansFilePath, "utf-8");
//       deletedClans = JSON.parse(data || "[]");
//     }
//     deletedClans.push(clan);
//     fs.writeFileSync(deletedClansFilePath, JSON.stringify(deletedClans, null, 2));
//     console.log(`[LOG] Clan "${clan.clanName}" saved to deletedClans.json.`);
//   } catch (error) {
//     console.error("[ERRO] Não foi possível salvar o Clan deletado:", error);
//   }
// };

export const deleteClanResources = async (guild, clanName) => {
  try {
    const clans = loadClans(); // Load the clans data

    // Retrieve the clan by name at the start
    const clan = Array.from(clans.values()).find((clan) => clan.clanName.toLowerCase() === clanName.toLowerCase());
    if (!clan) {
      console.warn(`[WARN] Clan "${clanName}" not found in data.`);
      return;
    }

    let channelDeleted = false;
    let roleDeleted = false;

    // Attempt to delete the clan's channel using channelId
    if (clan.channelId) {
      const clanChannel = await guild.channels.fetch(clan.channelId).catch(() => null);
      if (clanChannel) {
        await clanChannel.delete(`Deleting clan channel for ${clanName}`);
        console.log(`[LOG] Clan channel with ID "${clan.channelId}" deleted successfully.`);
        channelDeleted = true;
      } else {
        console.warn(`[WARN] Clan channel with ID "${clan.channelId}" not found or already deleted.`);
      }
    }

    // Fallback: Search for the channel by formatted name if not deleted
    if (!channelDeleted) {
      const formattedChannelName = `《👥》${clanName}`;
      const clanChannel = guild.channels.cache.find(c => c.name.toLowerCase() === formattedChannelName.toLowerCase());
      if (clanChannel) {
        await clanChannel.delete(`Deleting clan channel for ${clanName}`);
        console.log(`[LOG] Clan channel "${formattedChannelName}" deleted successfully.`);
        channelDeleted = true;
      } else {
        console.warn(`[WARN] Clan channel "${formattedChannelName}" not found.`);
      }
    }

    // Find and delete the role for the clan
    const role = guild.roles.cache.find(r => r.name.toLowerCase() === `clan ${clanName.toLowerCase()}`);
    if (role) {
      await role.delete(`Role do Clan ${clanName} excluído.`);
      console.log(`[LOG] Clan role "${clanName}" deleted successfully.`);
      roleDeleted = true;
    } else {
      console.warn(`Role do Clan ${clanName} não encontrado.`);
    }

    // Delay deletion of clan data by 1 minute if both channel and role are deleted successfully
    if (channelDeleted && roleDeleted) {
      console.log(`[LOG] Clan "${clanName}" data will be deleted in 1 minute.`);
      setTimeout(() => {
        saveDeletedClan(clan); // Save the deleted clan for rollback
        clans.delete(clan.leaderId);
        saveClans(clans);
        console.log(`[LOG] Clan "${clanName}" data deleted successfully from clans.json.`);
      }, 60000); // 1 minute delay
    } else {
      console.warn(`[WARN] Clan "${clanName}" data not deleted due to incomplete resource deletion.`);
    }
  } catch (error) {
    console.error(`[ERRO] Failed to delete clan resources for "${clanName}":`, error);
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