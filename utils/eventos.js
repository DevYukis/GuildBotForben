import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { loadClans, saveClans } from "./clanUtils.js";

export const eventos = {
  perguntas: {
    descricao: "Evento de perguntas interativas no chat.",
    executar: async (interaction, canal, pontos) => {
      const perguntas = [
        "Qual é o maior planeta do sistema solar?",
        "Quem descobriu o Brasil?",
        "Qual é a capital da França?",
      ];

      for (const pergunta of perguntas) {
        await canal.send(`❓ **Pergunta:** ${pergunta}`);
        await new Promise((resolve) => setTimeout(resolve, 10000)); // Espera 10 segundos entre as perguntas
      }

      await canal.send(`✅ **Evento de perguntas finalizado!**\nO evento valeu **${pontos} pontos**.`);
    },
  },

  desafios: {
    descricao: "Evento de desafios para os Clans.",
    executar: async (interaction, canal, pontos) => {
      const desafios = [
        "Complete uma missão em menos de 10 minutos!",
        "Recrute 3 novos membros para o seu Clan!",
        "Ganhe 5 partidas consecutivas no modo competitivo!",
      ];

      for (const desafio of desafios) {
        await canal.send(`⚔️ **Desafio:** ${desafio}`);
        await new Promise((resolve) => setTimeout(resolve, 15000)); // Espera 15 segundos entre os desafios
      }

      await canal.send(`✅ **Evento de desafios finalizado!**\nO evento valeu **${pontos} pontos**.`);
    },
  },

  quiz: {
    descricao: "Evento de quiz com perguntas de múltipla escolha.",
    executar: async (interaction, canal, pontos) => {
      const quiz = [
        {
          pergunta: "Qual é a capital do Brasil?",
          opcoes: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"],
          resposta: "Brasília",
        },
        {
          pergunta: "Quem pintou a Mona Lisa?",
          opcoes: ["Leonardo da Vinci", "Michelangelo", "Van Gogh", "Picasso"],
          resposta: "Leonardo da Vinci",
        },
      ];

      for (const { pergunta, opcoes, resposta } of quiz) {
        const opcoesTexto = opcoes.map((opcao, index) => `${index + 1}. ${opcao}`).join("\n");
        await canal.send(`❓ **Pergunta:** ${pergunta}\n${opcoesTexto}`);
        await new Promise((resolve) => setTimeout(resolve, 15000)); // Espera 15 segundos para a resposta

        await canal.send(`✅ **Resposta correta:** ${resposta}`);
      }

      await canal.send(`✅ **Evento de quiz finalizado!**\nO evento valeu **${pontos} pontos**.`);
    },
  },

  raid: {
    descricao: "Evento de Raid! O vencedor será determinado por sorteio, com chances proporcionais ao número de membros do Clan.",
    executar: async (interaction, canal, pontos, moedas, fakeClans = null) => {
      const clans = fakeClans || loadClans();
      const guild = interaction.guild;

      if (!clans || Object.keys(clans).length === 0) {
        return await canal.send("⚠️ Não há Clans registrados para participar do evento.");
      }

      // Mencionar todos os cargos dos Clans
      const mentions = Object.values(clans)
        .map((clan) => {
          const role = guild.roles.cache.get(clan.roleId);
          return role ? `<@&${role.id}>` : clan.clanName; // Usar o nome do Clan no modo de teste
        })
        .filter((mention) => mention !== null)
        .join(", ");

      // Criação da embed vermelha
      const embed = new EmbedBuilder()
        .setTitle("⚔️ Raid Iniciada!")
        .setColor(0xff0000) // Vermelho
        .setDescription(
          `Uma Raid foi iniciada! O vencedor será sorteado com base no número de membros do Clan.\n\n**Clans Participantes:**\n${mentions}\n\n🏆 **Prêmio:** ${pontos} pontos e ${moedas} moedas!`
        )
        .setFooter({ text: "Que vença o mais forte!" })
        .setTimestamp();

      await canal.send({ embeds: [embed] });

      // Simular o sorteio no modo de teste ou evento normal
      const weightedClans = [];
      Object.values(clans).forEach((clan) => {
        for (let i = 0; i < clan.members.length; i++) {
          weightedClans.push(clan.clanName);
        }
      });

      // Sorteio do vencedor após 3 minutos
      setTimeout(async () => {
        const winnerClan = weightedClans[Math.floor(Math.random() * weightedClans.length)];

        const winnerEmbed = new EmbedBuilder()
          .setTitle("🎉 Resultado da Raid")
          .setDescription(`O Clan vencedor foi **${winnerClan}**!\n\n🏆 **Prêmio:** ${pontos} pontos e ${moedas} moedas!`)
          .setColor(0x00ff00) // Verde
          .setFooter({ text: "Evento Finalizado" })
          .setTimestamp();

        await canal.send({ embeds: [winnerEmbed] });

        // Atualizar os pontos e moedas do Clan vencedor
        const winner = Object.values(clans).find((clan) => clan.clanName === winnerClan);
        if (winner) {
          winner.points = (winner.points || 0) + pontos;
          winner.coins = (winner.coins || 0) + moedas;
          saveClans(clans);
        }
      }, 3 * 60 * 1000); // 3 minutos
    },
  },
};