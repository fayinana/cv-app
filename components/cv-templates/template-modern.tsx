import type { CVData } from "./types";

interface Props {
  data: CVData;
}

export function TemplateModern({ data }: Props) {
  const { personal } = data;
  const name = personal.fullName || "Your Name";
  return (
    <div style={{ fontSize: 13, fontFamily: "'Open Sans', sans-serif", display: "flex", width: 794, minHeight: 1123, backgroundColor: "#ffffff", padding: 24, boxSizing: "border-box" }}>
      <div style={{ width: 280, backgroundColor: "#F7E0C1", padding: 24, flexShrink: 0 }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#111827", marginBottom: 2 }}>{name}</h2>
        {personal.title ? <p style={{ fontSize: "0.75rem", color: "#4b5563", marginBottom: 16 }}>{personal.title}</p> : null}
        <h3 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#374151", marginBottom: 4 }}>Contact</h3>
        {[personal.email, personal.phone, personal.location, personal.website, personal.linkedin, personal.github]
          .filter(Boolean)
          .map((line, i) => (
            <p key={i} style={{ fontSize: "0.6875rem", color: "#374151", marginBottom: 4 }}>{line}</p>
          ))}
        {data.summary ? (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#374151", marginBottom: 4 }}>About Me</h3>
            <p style={{ color: "#374151", whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: "0.75rem" }}>{data.summary}</p>
          </div>
        ) : null}
      </div>
      <div style={{ flex: 1, padding: 24 }}>
        <h2 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", color: "#1f2937", marginBottom: 12, borderBottom: "2px solid #F7E0C1", paddingBottom: 4 }}>Experience</h2>
        {data.experience.map((exp, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <p style={{ fontWeight: 600, color: "#111827" }}>{exp.role}</p>
              <span style={{ fontSize: "0.6875rem", color: "#9ca3af" }}>{exp.dates}</span>
            </div>
            <p style={{ color: "#c0884d", fontSize: "0.75rem", marginBottom: 4 }}>{exp.company}</p>
            <ul style={{ listStyleType: "disc", listStylePosition: "inside", color: "#4b5563", fontSize: "0.75rem", margin: 0, padding: 0 }}>
              {exp.bullets.map((b, j) => <li key={j}>{b}</li>)}
            </ul>
          </div>
        ))}
        {data.projects.length ? (
          <>
            <h2 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", color: "#1f2937", marginTop: 16, marginBottom: 12, borderBottom: "2px solid #F7E0C1", paddingBottom: 4 }}>Projects</h2>
            {data.projects.map((proj, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <p style={{ fontWeight: 600, color: "#111827" }}>{proj.title}</p>
                <p style={{ color: "#4b5563", fontSize: "0.75rem" }}>{proj.description}</p>
              </div>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}
