import { createRequire } from "module";
import mammoth from "mammoth";
import JSZip from "jszip";

const require = createRequire(import.meta.url);

export type ResumeExtractResult = {
  text: string;
  method: "pdf2json" | "pdf-raw-fallback" | "docx-mammoth" | "docx-xml-fallback" | "txt";
};

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\u0000/g, " ")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function isReadableResumeText(text: string): boolean {
  if (text.length < 80) return false;
  const letters = (text.match(/[A-Za-z]/g) ?? []).length;
  const visible = (text.match(/[A-Za-z0-9\s.,;:()\-_/+#@&%]/g) ?? []).length;
  if (letters < 40) return false;
  if (visible / Math.max(1, text.length) < 0.65) return false;
  return true;
}

function extractAsciiLikeTextFromPdfBuffer(buffer: Buffer): string {
  const decoded = buffer.toString("latin1");
  // Pull literal strings from PDF objects: (...) and <...> hex chunks.
  const parenMatches = decoded.match(/\((?:\\.|[^\\)]){2,}\)/g) ?? [];
  const hexMatches = decoded.match(/<([0-9A-Fa-f]{8,})>/g) ?? [];

  const parenText = parenMatches
    .map((chunk) =>
      chunk
        .slice(1, -1)
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\n")
        .replace(/\\t/g, " ")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
    )
    .join(" ");

  const hexText = hexMatches
    .map((chunk) => chunk.slice(1, -1))
    .map((hex) => {
      try {
        return Buffer.from(hex, "hex").toString("utf8");
      } catch {
        return "";
      }
    })
    .join(" ");

  return `${parenText}\n${hexText}`;
}

async function extractPdfWithPdf2Json(buffer: Buffer): Promise<string> {
  const PDFParser = require("pdf2json");
  return await new Promise<string>((resolve, reject) => {
    const parser = new PDFParser(null, true);
    const originalWarn = console.warn;
    const originalLog = console.log;
    const shouldSilence = (args: unknown[]) => {
      const first = String(args[0] ?? "");
      return (
        first.includes("NOT valid form element") ||
        first.includes("Unsupported: field.type of Link") ||
        first.includes("Setting up fake worker")
      );
    };
    console.warn = (...args: unknown[]) => {
      if (shouldSilence(args)) {
        return;
      }
      originalWarn(...args);
    };
    console.log = (...args: unknown[]) => {
      if (shouldSilence(args)) {
        return;
      }
      originalLog(...args);
    };
    const restoreWarn = () => {
      console.warn = originalWarn;
      console.log = originalLog;
    };
    parser.on("pdfParser_dataError", (errData: { parserError?: string }) => {
      restoreWarn();
      reject(new Error(errData?.parserError || "Failed to parse PDF."));
    });
    parser.on("pdfParser_dataReady", (pdfData: any) => {
      try {
        const pages = Array.isArray(pdfData?.Pages) ? pdfData.Pages : [];
        const lines: string[] = [];
        for (const page of pages) {
          const texts = Array.isArray(page?.Texts) ? page.Texts : [];
          for (const entry of texts) {
            const runs = Array.isArray(entry?.R) ? entry.R : [];
            for (const run of runs) {
              if (typeof run?.T === "string") {
                lines.push(decodeURIComponent(run.T));
              }
            }
          }
        }
        restoreWarn();
        resolve(lines.join(" "));
      } catch {
        restoreWarn();
        reject(new Error("Failed to extract PDF text segments."));
      }
    });
    parser.parseBuffer(buffer);
  });
}

async function extractDocxWithXmlFallback(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const entry = zip.file("word/document.xml");
  if (!entry) return "";
  const xml = await entry.async("text");
  // Extract text nodes from <w:t>..</w:t>.
  const textRuns = xml.match(/<w:t[^>]*>[\s\S]*?<\/w:t>/g) ?? [];
  const text = textRuns
    .map((node) => node.replace(/<[^>]+>/g, ""))
    .map((s) =>
      s
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
    )
    .join(" ");
  return text;
}

export async function extractResumeText(file: File): Promise<ResumeExtractResult> {
  const fileName = file.name.toLowerCase();
  const mimeType = (file.type || "").toLowerCase();
  const isPdf = fileName.endsWith(".pdf") || mimeType.includes("pdf");
  const isDocx =
    fileName.endsWith(".docx") ||
    mimeType.includes("officedocument.wordprocessingml.document");
  const isTxt = fileName.endsWith(".txt") || mimeType.startsWith("text/");

  if (isTxt) {
    const txt = normalizeExtractedText(await file.text());
    if (!isReadableResumeText(txt)) {
      throw new Error(
        "Text file is too short or unreadable. Please upload a full CV in TXT, PDF, or DOCX."
      );
    }
    return { text: txt, method: "txt" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (isDocx) {
    const mammothText = normalizeExtractedText(
      (await mammoth.extractRawText({ buffer })).value || ""
    );
    if (isReadableResumeText(mammothText)) {
      return { text: mammothText, method: "docx-mammoth" };
    }

    const fallbackText = normalizeExtractedText(await extractDocxWithXmlFallback(buffer));
    if (isReadableResumeText(fallbackText)) {
      return { text: fallbackText, method: "docx-xml-fallback" };
    }

    throw new Error(
      "Could not read text from DOCX. Please re-save as DOCX (not image-based) or upload TXT."
    );
  }

  if (isPdf) {
    const primary = normalizeExtractedText(await extractPdfWithPdf2Json(buffer).catch(() => ""));
    if (isReadableResumeText(primary)) {
      return { text: primary, method: "pdf2json" };
    }

    const fallback = normalizeExtractedText(extractAsciiLikeTextFromPdfBuffer(buffer));
    if (isReadableResumeText(fallback)) {
      return { text: fallback, method: "pdf-raw-fallback" };
    }

    throw new Error(
      "Could not extract text from PDF. This file may be scanned/image-only. Please upload DOCX or a searchable PDF."
    );
  }

  throw new Error("Unsupported file format. Please upload PDF, DOCX, or TXT.");
}
