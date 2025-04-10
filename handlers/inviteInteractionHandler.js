import { loadClans, saveClans } from "../utils/clanUtils.js";

export const handleInviteInteraction = async (interaction) => {
  if (!interaction.isButton()) return;

  const clans = loadClans();
  const userId = interaction.user.id;
  const [action, inviterId, targetUserId] = interaction.customId.split("_").slice(-3);

  const clan = clans.get(inviterId);

  // Verifica se é o usuário correto
  if (userId !== targetUserId) {
    try {
      await interaction.reply({
        content: "⚠️ Você não tem permissão para interagir com este convite.",
        flags: 1 << 6,
      });
    } catch (err) {
      console.warn("Erro ao tentar responder a interação inválida:", err);
    }
    return;
  }

  // Tenta deferReply para segurar a interação
  try {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral: true });
    }
  } catch (err) {
    console.warn("Erro ao deferir a interação:", err);
    return;
  }

  if (!clan || typeof clan.clanName !== "string") {
    return await interaction.editReply({
      content: "⚠️ O Clan não possui informações válidas ou não existe mais.",
    });
  }

  if (action === "accept") {
    if (!Array.isArray(clan.members)) {
      clan.members = [];
    }
    if (!clan.members.includes(userId)) {
      clan.members.push(userId);
    }

    // Remover pendingInvite se existir
    if (clans.has(userId)) {
      const userData = clans.get(userId);
      delete userData.pendingInvite;
      clans.set(userId, userData);
    }

    clans.set(inviterId, clan);
    saveClans(clans);

    return await interaction.editReply({
      content: `✅ Você entrou no Clan **${clan.clanName}**!`,
    });

  } else if (action === "decline") {
    if (clans.has(userId)) {
      const userData = clans.get(userId);
      if (userData?.pendingInvite === inviterId) {
        delete userData.pendingInvite;
        clans.set(userId, userData);
        saveClans(clans);
      }
    }

    return await interaction.editReply({
      content: "❌ Você recusou o convite para o Clan.",
    });
  }
};
