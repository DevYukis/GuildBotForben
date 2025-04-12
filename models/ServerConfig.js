import mongoose from "mongoose";

const ServerConfigSchema = new mongoose.Schema({
  serverId: { type: String, required: true, unique: true }, // ID do servidor
  clanCategoryId: { type: String, required: false }, // ID da categoria para Clans
});

export default mongoose.model("ServerConfig", ServerConfigSchema);