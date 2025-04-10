import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { loadClans, saveClans, deleteClanResources } from "../utils/clanUtils.js";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { resolve } from "path";

const deletedClansPath = resolve("data", "deletedClans.json");

function saveDeletedClan(clan) {
  let deletedClans = [];
  if (existsSync(deletedClansPath)) {
    try {
      const fileContent = readFileSync(deletedClansPath, "utf-8");
      deletedClans = JSON.parse(fileContent);
      if (!Array.isArray(deletedClans)) {
        console.warn("deletedClans.json não é um array. Inicializando como vazio.");
        deletedClans = [];
      }
    } catch (error) {
      console.error("Erro ao ler deletedClans.json, inicializando como vazio:", error);
      deletedClans = [];
    }
  }
  deletedClans.push({ ...clan, deletedAt: new Date().toISOString() });
  writeFileSync(deletedClansPath, JSON.stringify(deletedClans, null, 2));
  console.log(`Clan "${clan.clanName}" salvo em deletedClans.json.`);
}

export default {
  data: new SlashCommandBuilder()
    .setName("clan-deletar")
    .setDescription("Deleta um Clan específico ou todos os Clans.")
    .addStringOption((option) =>
      option
        .setName("clan")
        .setDescription("Nome do Clan que deseja deletar. Deixe vazio para deletar todos.")
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has("Administrator")) {
      return await interaction.reply({
        content: "⚠️ Apenas administradores podem usar este comando.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const clans = loadClans();
    const clanName = interaction.options.getString("clan");

    if (clanName && clanName.toLowerCase() === "all") {
      for (const [, clan] of clans) {
        try {
          await deleteClanResources(interaction.guild, clan.clanName);
          saveDeletedClan(clan);
        } catch (error) {
          console.error(`Erro ao deletar recursos do Clan "${clan.clanName}":`, error);
        }
      }
      clans.clear();
      saveClans(clans); // Save updated clans after deletion
      return await interaction.reply({
        content: "✅ Todos os Clans foram deletados com sucesso.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!clanName) {
      return await interaction.reply({
        content: "⚠️ Para deletar todos os Clans, digite 'all' como nome do Clan.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const clanEntry = Array.from(clans.entries()).find(
      ([, clan]) => clan.clanName.toLowerCase() === clanName.toLowerCase()
    );

    if (!clanEntry) {
      return await interaction.reply({
        content: `⚠️ O Clan "${clanName}" não foi encontrado.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      await deleteClanResources(interaction.guild, clanEntry[1].clanName);
      saveDeletedClan(clanEntry[1]);
    } catch (error) {
      console.error(`Erro ao deletar recursos do Clan "${clanName}":`, error);
      return await interaction.reply({
        content: `⚠️ Ocorreu um erro ao deletar os recursos do Clan "${clanName}".`,
        flags: MessageFlags.Ephemeral,
      });
    }

    clans.delete(clanEntry[0]);
    saveClans(clans); // Save updated clans after deletion

    await interaction.reply({
      content: `✅ O Clan "${clanName}" foi deletado com sucesso.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
