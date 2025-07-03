import mongoose from "mongoose";

const signatureSchema = new mongoose.Schema({
  text: String,
  font: String,
  x: Number,
  y: Number,
  page: Number,
  signedAt: Date,
}, { _id: false });

const documentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  dateUploaded: { type: Date, default: Date.now },
  size: Number,
  status: { type: String, enum: ["pending", "signed"], default: "pending" },
  signature: signatureSchema,
});

export default mongoose.model("Document", documentSchema); 