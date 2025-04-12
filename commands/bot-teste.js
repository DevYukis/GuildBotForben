import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import {
  loadClans,
  saveClans,
  createClanResources,
  deleteClanResources,
  restoreDeletedClan,
  getCategoryChannelId,
} from "../utils/clanUtils.js";
import fs from "fs";

export const saveClans = (clans) => {
  const clansPath = "data/clans.json";
  const clansObject = Object.fromEntries(clans); // Converte o Map para um objeto
  fs.writeFileSync(clansPath, JSON.stringify(clansObject, null, 2));
};

export const loadClans = () => {
  const clansPath = "data/clans.json";
  if (!fs.existsSync(clansPath)) {
    return new Map(); // Retorna um Map vazio se o arquivo não existir
  }
  const clansData = JSON.parse(fs.readFileSync(clansPath, "utf-8"));
  return new Map(Object.entries(clansData)); // Converte o objeto para um Map
};

export default {
  data: new SlashCommandBuilder()
    .setName("bot-teste")
    .setDescription("Testa todas as funções principais do bot para verificar se estão funcionando corretamente.")
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
      // Teste de carregar e salvar Clans
      const clans = loadClans();
      const testClanId = "test_clan_id";
      const testClan = {
        leaderId: "test_leader_id",
        clanName: "Test Clan",
        clanTag: "TEST",
        clanDescription: "Clan de teste",
        members: ["test_leader_id"],
        roleId: "test_role_id",
        textChannelId: "test_text_channel_id",
        voiceChannelId: "test_voice_channel_id",
      };

      if (!(clans instanceof Map)) {
        // Converte o objeto para um Map, se necessário
        const clansMap = new Map(Object.entries(clans));
        clansMap.set(testClanId, testClan);
        saveClans(clansMap); // Salva o Map diretamente
      } else {
        clans.set(testClanId, testClan);
        saveClans(clans);
      }

      const reloadedClans = loadClans();
      if (!reloadedClans.has(testClanId)) {
        throw new Error("Falha ao salvar ou carregar Clans.");
      }
      reloadedClans.delete(testClanId);
      saveClans(reloadedClans);

      embed.addFields({ name: "Clans", value: "✅ Carregar e salvar Clans funcionando." });

      // Teste de criar e deletar recursos de Clan
      const guild = interaction.guild;
      const { roleId, textChannelId, voiceChannelId } = await createClanResources(
        guild,
        "Test Clan",
        interaction.user.id
      );

      // Deletar o canal de texto diretamente
      const textChannel = guild.channels.cache.get(textChannelId);
      if (textChannel) {
        await textChannel.delete().catch((error) => {
          console.error(`[ERRO] Não foi possível excluir o canal de texto: ${error}`);
          throw new Error("Falha ao deletar o canal de texto.");
        });
      }

      // Deletar o canal de voz diretamente
      const voiceChannel = guild.channels.cache.get(voiceChannelId);
      if (voiceChannel) {
        await voiceChannel.delete().catch((error) => {
          console.error(`[ERRO] Não foi possível excluir o canal de voz: ${error}`);
          throw new Error("Falha ao deletar o canal de voz.");
        });
      }

      // Deletar o cargo diretamente
      const role = guild.roles.cache.get(roleId);
      if (role) {
        await role.delete().catch((error) => {
          console.error(`[ERRO] Não foi possível excluir o cargo: ${error}`);
          throw new Error("Falha ao deletar o cargo.");
        });
      }

      embed.addFields({ name: "Recursos de Clan", value: "✅ Criar e deletar recursos de Clan funcionando." });

      // Teste de restaurar Clan deletado
      const deletedClan = {
        leaderId: "test_leader_id",
        clanName: "Deleted Test Clan",
        clanTag: "DELTEST",
        clanDescription: "Clan deletado de teste",
        members: ["test_leader_id"],
        roleId: "test_role_id",
        textChannelId: "test_text_channel_id",
        voiceChannelId: "test_voice_channel_id",
      };
      const deletedClansPath = "data/deletedClans.json";
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

      // Teste de obter ID da categoria
      const categoryId = getCategoryChannelId();
      if (!categoryId) {
        throw new Error("Falha ao obter o ID da categoria de Clans.");
      }
      embed.addFields({ name: "Categoria de Clans", value: `✅ ID da categoria obtido: ${categoryId}` });

      // Teste de manipulação de arquivos
      const testFilePath = "data/test.json";
      const testData = { key: "value" };
      fs.writeFileSync(testFilePath, JSON.stringify(testData, null, 2));
      const loadedData = JSON.parse(fs.readFileSync(testFilePath, "utf-8"));
      if (loadedData.key !== "value") {
        throw new Error("Falha ao manipular arquivos.");
      }
      fs.unlinkSync(testFilePath); // Remove o arquivo de teste
      embed.addFields({ name: "Manipulação de Arquivos", value: "✅ Manipulação de arquivos funcionando." });

      // Finaliza o teste com sucesso
      embed.setColor(0x00ff00).setDescription("✅ Todos os testes foram concluídos com sucesso!");
    } catch (error) {
      console.error("[ERRO] Teste de funcionalidades falhou:", error);
      embed.setColor(0xff0000).setDescription("⚠️ Um ou mais testes falharam. Verifique os logs para mais detalhes.");
    }

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
