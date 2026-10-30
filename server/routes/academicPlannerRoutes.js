
const express = require("express");
const multer = require("multer");
const { extractDocumentText } = require("../utils/extractDocumentText");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Supported study files: PDF, PowerPoint, Word, and plain text.
const allowedExtensions = new Set([".pdf", ".pptx", ".docx", ".txt"]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const extension = require("path").extname(file.originalname || "").toLowerCase();
    if (allowedExtensions.has(extension)) return callback(null, true);
    return callback(new Error("Unsupported file type. Upload PDF, PPTX, DOCX, or TXT."));
  },
});

// Upload PDF and generate smart notes
router.post(
  "/upload",
  authMiddleware,
  upload.single("document"),
  async (req, res) => {
    try {
      // 1. Validate and extract supported document text.
      if (!req.file) {
        return res.status(400).json({ message: "Please select a study file." });
      }

      const extracted = await extractDocumentText(req.file);
      const extractedText = extracted.text;
      if (!extractedText) {
        return res.status(422).json({
          message: "No readable text was found. Scanned PDFs and image-only slides need OCR, which is not enabled in this build.",
        });
      }

      if (extractedText.length > 30000) {
        return res.status(413).json({
          message: "This file is too long for one notes request. Upload a smaller or unit-wise file.",
        });
      }

      // 4. Check Gemini API key
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          message: "Gemini API key is missing in the server .env file.",
        });
      }

      // 5. Initialize Gemini
      const { GoogleGenAI } = await import("@google/genai");

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });

      // 3. Generate genuinely concise notes instead of returning extracted text.
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
        contents: `
You are an expert engineering-college tutor. Transform the supplied study material into CONCISE, high-quality revision notes. Do NOT reproduce the source verbatim and do NOT simply reformat extracted text.

SOURCE-FAITHFULNESS:
- Use only the supplied material for factual claims. Never invent definitions, formulas, examples, syllabus topics, or exam predictions.
- Keep important technical terms, equations, algorithms, steps, and distinctions accurate.
- Remove repeated explanations, filler, and irrelevant text.
- If a formula or passage is ambiguous, explicitly mark it as unclear instead of guessing.
- For PowerPoint, preserve slide order and include slide references when useful.

LENGTH:
- Aim for about 20–30% of the source length for normal material, and be even more selective for repetitive material.
- Use short bullets and compact explanations; do not write long paragraphs.
- Include only sections relevant to this document.

OUTPUT IN MARKDOWN:
# Quick Overview (3–5 bullets)
## Key Concepts (simple explanations, usually 1–3 bullets per concept)
## Important Definitions
## Formulas / Algorithms (only if present; explain symbols briefly)
## Comparisons (a table only where useful)
## Examples (only the most useful source-supported examples)
## Exam Revision Checklist (5–10 points)
## Self-Test (up to 5 questions, with short answers grounded in the source)

Do not include empty headings. Do not include an introductory essay. The result must be clearly shorter and more useful for revision than the extracted source.

SOURCE FILE: ${req.file.originalname}
SOURCE CONTENT:
${extractedText}
`,
        config: { maxOutputTokens: 2600 },
      });

      const notes = response.text?.trim();

      if (!notes) {
        return res.status(502).json({
          message:
            "Gemini did not generate notes. Please try uploading the PDF again.",
        });
      }

      // 7. Return generated notes to frontend
      return res.json({
        message: "Smart notes generated successfully.",
        fileName: req.file.originalname,
        totalPages: extracted.pages,
        totalSlides: extracted.slides,
        fileType: require("path").extname(req.file.originalname).slice(1).toLowerCase(),
        extractedCharacters: extractedText.length,
        notes,
      });
    
    } catch (error) {
      console.error("Academic Smart Notes error:", error);
      console.error("Error message:", error.message);
      console.error("Error status:", error.status);

      return res.status(500).json({
        message: error.message || "Could not generate smart notes.",
      });
    }

  }
);

// Handle upload validation errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "File must be 10 MB or smaller."
        : error.message;

    return res.status(400).json({ message });
  }

  if (error.message && error.message.startsWith("Unsupported file type.")) {
    return res.status(400).json({ message: error.message });
  }

  next(error);
});

module.exports = router;
