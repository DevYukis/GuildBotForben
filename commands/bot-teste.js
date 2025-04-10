import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { loadClans, saveClans, createClanResources, deleteClanResources, restoreDeletedClan } from "../utils/clanUtils.js";

export default {
  data: new SlashCommandBuilder()
    .setName("bot-teste")
    .setDescription("Testa as principais funções do bot para verificar se estão funcionando corretamente.")
    .setDefaultPermission(true),

  async execute(interaction) {
    if (!interaction.member.permissions.has("Administrator")) {
      return await interaction.reply({
        content: "⚠️ Apenas administradores podem usar este comando.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("🛠️ Teste de Funcionalidades do Bot")
      .setColor(0x3498db)
      .setDescription("Verificando as principais funções do bot...");

    try {
      // Test loadClans and saveClans
      const clans = loadClans();
      const testClanId = "test_clan_id";
      const testClan = {
        leaderId: "test_leader_id",
        clanName: "Test Clan",
        clanTag: "TEST",
        clanDescription: "Clan de teste",
        members: ["test_leader_id"],
        roleId: "test_role_id",
        channelId: "test_channel_id",
      };
      clans.set(testClanId, testClan);
      saveClans(clans);
      const reloadedClans = loadClans();
      if (!reloadedClans.has(testClanId)) {
        throw new Error("Falha ao salvar ou carregar Clans.");
      }
      reloadedClans.delete(testClanId);
      saveClans(reloadedClans);

      embed.addFields({ name: "Clans", value: "✅ Carregar e salvar Clans funcionando." });

      // Test createClanResources and deleteClanResources
      const guild = interaction.guild;
      const { roleId, channelId } = await createClanResources(guild, "Test Clan", interaction.user.id);
      await deleteClanResources(guild, "Test Clan");

      embed.addFields({ name: "Recursos de Clan", value: "✅ Criar e deletar recursos de Clan funcionando." });

      // Test restoreDeletedClan
      const deletedClan = {
        leaderId: "test_leader_id",
        clanName: "Deleted Test Clan",
        clanTag: "DELTEST",
        clanDescription: "Clan deletado de teste",
        members: ["test_leader_id"],
        roleId: "test_role_id",
        channelId: "test_channel_id",
      };
      const deletedClansPath = "data/deletedClans.json";
      const fs = require("fs");
      const deletedClans = fs.existsSync(deletedClansPath)
        ? JSON.parse(fs.readFileSync(deletedClansPath, "utf-8"))
        : [];
      deletedClans.push(deletedClan);
      fs.writeFileSync(deletedClansPath, JSON.stringify(deletedClans, null, 2));
      const restored = restoreDeletedClan("Deleted Test Clan");
      if (!restored) {
        throw new Error("Falha ao restaurar Clan deletado.");
      }

      embed.addFields({ name: "Restaurar Clan", value: "✅ Restaurar Clan deletado funcionando." });

      // Finalize the test
      embed.setColor(0x00ff00).setDescription("✅ Todos os testes foram concluídos com sucesso!");
    } catch (error) {
      console.error("[ERRO] Teste de funcionalidades falhou:", error);
      embed.setColor(0xff0000).setDescription("⚠️ Um ou mais testes falharam. Verifique os logs para mais detalhes.");
    }

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
