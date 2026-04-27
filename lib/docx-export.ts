import JSZip from "jszip";
import type { CVData } from "@/components/cv-templates";

type DocxLabels = {
  candidateName: string;
  summary: string;
  skills: string;
  experience: string;
  education: string;
  projects: string;
};

const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

const ROOT_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const DOCUMENT_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr><w:sz w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:rPr><w:b/><w:sz w:val="28"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
  </w:style>
</w:styles>`;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function paragraph(text: string, style?: "Heading1" | "Heading2") {
  const styleXml = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : "";
  return `<w:p>${styleXml}<w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function bullet(text: string) {
  return paragraph(`• ${text}`);
}

function section(title: string, body: string[]) {
  const content = body.filter(Boolean);
  if (!content.length) return "";
  return [paragraph(title, "Heading2"), ...content.map((line) => paragraph(line))].join("");
}

function buildDocumentXml(data: CVData, labels: DocxLabels) {
  const p = data.personal;
  const contact = [p.email, p.phone, p.location, p.website, p.linkedin, p.github].filter(Boolean).join(" | ");
  const experience = data.experience.flatMap((item) => [
    `${item.role}${item.company ? ` - ${item.company}` : ""}${item.dates ? ` (${item.dates})` : ""}`,
    ...item.bullets.map((line) => `• ${line}`),
  ]);
  const education = data.education.map((item) =>
    [item.degree, item.school, item.year].filter(Boolean).join(" - ")
  );
  const projects = data.projects.flatMap((item) => [
    item.title,
    ...(item.description ? [item.description] : []),
  ]);

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraph(p.fullName || labels.candidateName, "Heading1")}
    ${p.title ? paragraph(p.title) : ""}
    ${contact ? paragraph(contact) : ""}
    ${section(labels.summary, [data.summary])}
    ${section(labels.skills, [data.skills.join(", ")])}
    ${data.experience.length ? paragraph(labels.experience, "Heading2") : ""}
    ${experience.map((line) => (line.startsWith("•") ? bullet(line.slice(2)) : paragraph(line))).join("")}
    ${section(labels.education, education)}
    ${section(labels.projects, projects)}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

export async function exportCvDataToDocx(data: CVData, labels: DocxLabels, filename = "cv_draft.docx") {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", CONTENT_TYPES_XML);
  zip.folder("_rels")?.file(".rels", ROOT_RELS_XML);
  const word = zip.folder("word");
  word?.file("document.xml", buildDocumentXml(data, labels));
  word?.file("styles.xml", STYLES_XML);
  word?.folder("_rels")?.file("document.xml.rels", DOCUMENT_RELS_XML);

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
