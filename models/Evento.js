import mongoose from "mongoose";

const EventoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  descricao: { type: String, required: true },
  tipo: { type: String, required: true },
  metodo: { type: String, required: true },
  mensagem: { type: String, required: true },
  criadoPor: { type: String, required: true },
  criadoEm: { type: Date, default: Date.now },
});

export default mongoose.model("Evento", EventoSchema);