import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import path from "path";
import { fileURLToPath } from "url";
import { protect } from "./middlewares/authMiddleware.js";

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || "*", 
  credentials: true,
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Serve uploads statically
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// user routes
app.use("/api/auth", authRoutes);
//document routes
app.use("/api/documents", protect, documentRoutes);



export { app };
