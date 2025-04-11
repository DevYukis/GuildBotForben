import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { handleInteraction } from "../handlers/interactionHandlers.js";

export default {
  data: new SlashCommandBuilder()
    .setName("testinvites")
    .setDescription("test"),
  
  async execute(interaction) {
    try {
      // Simula uma interação de botão para enviar convites
      const mockInteraction = {
        ...interaction,
        customId: "create_clan_button", // ID do botão que será testado
        isButton: () => true, // Simula que a interação é um botão
        reply: async (response) => {
          console.log("Resposta simulada:", response);
          await interaction.reply({
            content: "✅ Teste de interação concluído. Verifique os logs para detalhes.",
            flags: MessageFlags.Ephemeral,
          });
        },
        showModal: async (modal) => {
          console.log("Modal exibido:", modal);
          await interaction.reply({
            content: "✅ Modal de criação de Clan exibido com sucesso.",
            flags: MessageFlags.Ephemeral,
          });
        },
      };

      // Chama o handler de interações com a interação simulada
      await handleInteraction(mockInteraction);
    } catch (error) {
      console.error("Erro ao testar as interações de envio de convites:", error);
      await interaction.reply({
        content: "⚠️ Ocorreu um erro ao testar as interações de envio de convites.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};