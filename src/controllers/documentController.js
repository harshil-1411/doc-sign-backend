import Document from "../models/Document.js";
import path from "path";
import fs from "fs";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const { originalname, filename, size, path: filePath } = req.file;
    const userId = req.user._id;
    const document = await Document.create({
      filename,
      originalName: originalname,
      userId,
      dateUploaded: new Date(),
      size,
      status: "pending",
    });
    res.status(201).json({ message: "File uploaded", document });
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

export const listDocuments = async (req, res) => {
  try {
    const userId = req.user._id;
    const documents = await Document.find({ userId }).sort({ dateUploaded: -1 });
    res.status(200).json({ documents });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch documents", error: error.message });
  }
};

export const getDocument = async (req, res) => {
  try {
    const { userId, filename } = req.params;
    const document = await Document.findOne({ userId, filename });
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    const filePath = path.join(process.cwd(), "uploads", userId, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }
    res.setHeader("Content-Type", "application/pdf");
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    res.status(500).json({ message: "Failed to serve document", error: error.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { userId, filename } = req.params;
    const document = await Document.findOneAndDelete({ userId, filename });
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    const filePath = path.join(process.cwd(), "uploads", userId, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    // Also delete signed version if exists
    const signedPath = path.join(process.cwd(), "uploads", userId, `signed-${filename}`);
    if (fs.existsSync(signedPath)) {
      fs.unlinkSync(signedPath);
    }
    res.status(200).json({ message: "Document deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete document", error: error.message });
  }
};

export const signDocument = async (req, res) => {
  try {
    const { filename, pageNumber, xPercent, yPercent, signatureText, font } = req.body;
    const userId = req.user._id;
    if (!filename || !signatureText || xPercent == null || yPercent == null || pageNumber == null) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const document = await Document.findOne({ userId, filename });
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    const filePath = path.join(process.cwd(), "uploads", userId.toString(), filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }
    // Load PDF
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const page = pages[pageNumber];
    const { width: pageWidth, height: pageHeight } = page.getSize();
    // Convert percentages to PDF coordinates
    const x = xPercent * pageWidth;
    const y = pageHeight - (yPercent * pageHeight); // Flip Y axis
    // Font selection
    let selectedFont;
    switch (font) {
      case "Cursive":
      case "Script":
        selectedFont = await pdfDoc.embedFont(StandardFonts.ZapfDingbats);
        break;
      case "Serif":
        selectedFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
        break;
      case "Monospace":
        selectedFont = await pdfDoc.embedFont(StandardFonts.Courier);
        break;
      case "Fantasy":
        selectedFont = await pdfDoc.embedFont(StandardFonts.Symbol);
        break;
      case "Sans":
      default:
        selectedFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        break;
    }
    // Draw signature
    page.drawText(signatureText, {
      x,
      y,
      size: 24,
      font: selectedFont,
      color: rgb(0, 0, 0),
    });
    // Save as signed-{filename}
    const signedFilename = `signed-${filename}`;
    const signedPath = path.join(process.cwd(), "uploads", userId.toString(), signedFilename);
    const signedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(signedPath, signedPdfBytes);
    // Update MongoDB
    document.status = "signed";
    document.signature = {
      text: signatureText,
      font,
      x,
      y,
      page: pageNumber,
      signedAt: new Date(),
    };
    await document.save();
    res.status(200).json({ message: "Document signed", signedFilename });
  } catch (error) {
    res.status(500).json({ message: "Failed to sign document", error: error.message });
  }
};

export const getSignedDocument = async (req, res) => {
  try {
    const { userId, filename } = req.params;
    const signedFilename = `signed-${filename}`;
    const signedPath = path.join(process.cwd(), "uploads", userId, signedFilename);
    if (!fs.existsSync(signedPath)) {
      return res.status(404).json({ message: "Signed file not found" });
    }
    res.setHeader("Content-Type", "application/pdf");
    fs.createReadStream(signedPath).pipe(res);
  } catch (error) {
    res.status(500).json({ message: "Failed to serve signed document", error: error.message });
  }
}; 