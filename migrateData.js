import fs from "fs";
import path from "path";
import connectDB from "./db.js";
import Clan from "./models/Clan.js";

const migrateData = async () => {
  await connectDB();

  const clansFilePath = path.resolve("data", "clans.json");

  if (fs.existsSync(clansFilePath)) {
    const clansData = JSON.parse(fs.readFileSync(clansFilePath, "utf-8"));

    for (const [leaderId, clan] of Object.entries(clansData)) {
      await Clan.create({
        leaderId,
        ...clan,
      });
    }

    console.log("✅ Dados dos Clans migrados com sucesso!");
  } else {
    console.log("⚠️ Arquivo clans.json não encontrado.");
  }

  process.exit();
};

migrateData();