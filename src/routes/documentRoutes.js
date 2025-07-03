import express from "express";
import multer from "multer";
import fs from "fs";
import {
  uploadDocument,
  listDocuments,
  getDocument,
  deleteDocument,
  signDocument,
  getSignedDocument,
} from "../controllers/documentController.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.body.userId || req.user?._id;
    const userDir = `uploads/${userId}`;
    // Auto-create user upload folder if it doesn't exist
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

router.post("/upload", upload.single("pdf"), uploadDocument);
router.get("/:userId", listDocuments);
router.get("/:userId/:filename", getDocument);
router.delete("/:userId/:filename", deleteDocument);
router.post("/sign", signDocument);
router.get("/signed/:userId/:filename", getSignedDocument);

export default router; 