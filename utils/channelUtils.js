import ChannelConfig from "../models/ChannelConfig.js";

export const saveChannelConfig = async (serverId, config) => {
  try {
    await ChannelConfig.findOneAndUpdate(
      { serverId },
      { $set: config },
      { upsert: true }
    );
    console.log(`[LOG] Configurações de canais salvas para o servidor ${serverId}.`);
  } catch (error) {
    console.error(`[ERRO] Não foi possível salvar as configurações de canais: ${error}`);
  }
};

export const loadChannelConfig = async (serverId) => {
  try {
    const config = await ChannelConfig.findOne({ serverId });
    if (!config) {
      console.warn(`[WARN] Nenhuma configuração encontrada para o servidor ${serverId}.`);
      return null;
    }
    return config;
  } catch (error) {
    console.error(`[ERRO] Não foi possível carregar as configurações de canais: ${error}`);
    return null;
  }
};