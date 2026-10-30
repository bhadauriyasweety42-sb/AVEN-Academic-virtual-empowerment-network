const path = require("path");
const pdfParse = require("pdf-parse");
const AdmZip = require("adm-zip");

function decodeXml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

async function extractDocumentText(file) {
  const extension = path.extname(file.originalname || "").toLowerCase();

  if (extension === ".pdf") {
    const parsed = await pdfParse(file.buffer);
    return { text: (parsed.text || "").trim(), pages: parsed.numpages || null, slides: null };
  }

  if (extension === ".docx") {
    const zip = new AdmZip(file.buffer);
    const documentEntry = zip.getEntry("word/document.xml");
    if (!documentEntry) throw new Error("This DOCX file does not contain readable document text.");
    const xml = documentEntry.getData().toString("utf8");
    const text = xml
      .replace(/<\/w:p>/g, "\n")
      .replace(/<w:tab\b[^>]*\/>/g, "\t")
      .replace(/<w:br\b[^>]*\/>/g, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ");
    const extracted = [...xml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)]
      .map((match) => decodeXml(match[1]))
      .join(" ");
    return { text: (extracted || text).trim(), pages: null, slides: null };
  }

  if (extension === ".pptx") {
    const zip = new AdmZip(file.buffer);
    const slideEntries = zip.getEntries()
      .filter((entry) => /^ppt\/slides\/slide\d+\.xml$/i.test(entry.entryName))
      .sort((a, b) => {
        const aNumber = Number(a.entryName.match(/slide(\d+)\.xml/i)?.[1] || 0);
        const bNumber = Number(b.entryName.match(/slide(\d+)\.xml/i)?.[1] || 0);
        return aNumber - bNumber;
      });

    const slides = slideEntries.map((entry, index) => {
      const xml = entry.getData().toString("utf8");
      const parts = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)]
        .map((match) => decodeXml(match[1]))
        .filter(Boolean);
      return parts.length ? `Slide ${index + 1}\n${parts.join(" ")}` : "";
    }).filter(Boolean);

    return { text: slides.join("\n\n").trim(), pages: null, slides: slideEntries.length };
  }

  if (extension === ".txt" || extension === ".md") {
    return { text: file.buffer.toString("utf8").trim(), pages: null, slides: null };
  }

  throw new Error("Unsupported file type. Upload PDF, PPTX, DOCX, or TXT.");
}

module.exports = { extractDocumentText };
