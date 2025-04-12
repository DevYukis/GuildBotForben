import mongoose from "mongoose";

const DeletedClanSchema = new mongoose.Schema({
  clanName: { type: String, required: true },
  clanTag: { type: String, required: true },
  clanDescription: { type: String, default: "" },
  members: { type: [String], default: [] },
  leaderId: { type: String, required: true },
  roleId: { type: String },
  textChannelId: { type: String },
  voiceChannelId: { type: String },
  points: { type: Number, default: 0 },
  coins: { type: Number, default: 0 },
  creationDate: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: Date.now },
});

export default mongoose.model("DeletedClan", DeletedClanSchema);