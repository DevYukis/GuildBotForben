import mongoose from "mongoose";

const ChannelConfigSchema = new mongoose.Schema({
  serverId: { type: String, required: true, unique: true }, // ID do servidor
  clanCategoryId: { type: String, required: false }, // ID da categoria de Clans
});

export default mongoose.model("ChannelConfig", ChannelConfigSchema);