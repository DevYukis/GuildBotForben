import mongoose from "mongoose";

const ClanSchema = new mongoose.Schema({
  leaderId: { type: String, required: true },
  clanName: { type: String, required: true },
  clanTag: { type: String, required: true },
  clanDescription: { type: String, default: "" },
  members: { type: [String], default: [] },
  roleId: { type: String },
  textChannelId: { type: String },
  voiceChannelId: { type: String },
  points: { type: Number, default: 0 },
  coins: { type: Number, default: 0 },
  creationDate: { type: Date, default: Date.now },
});

export default mongoose.model("Clan", ClanSchema);