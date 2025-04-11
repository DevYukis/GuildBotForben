import fs from "fs";
import path from "path";

const dataFolderPath = path.resolve("data");
const invitesFilePath = path.join(dataFolderPath, "invites.json");

// Carregar os convites do arquivo
export const loadInvites = () => {
  if (!fs.existsSync(invitesFilePath)) {
    return new Map();
  }
  const data = fs.readFileSync(invitesFilePath, "utf-8");
  return new Map(Object.entries(JSON.parse(data)));
};

// Salvar os convites no arquivo
export const saveInvites = (invites) => {
  // Garantir que a pasta 'data' existe
  if (!fs.existsSync(dataFolderPath)) {
    fs.mkdirSync(dataFolderPath);
  }
  fs.writeFileSync(invitesFilePath, JSON.stringify(Object.fromEntries(invites), null, 2));
};