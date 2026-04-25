import type { CVData } from "./types";

interface Props {
  data: CVData;
}

export function TemplateClassic({ data }: Props) {
  const { personal } = data;
  const name = personal.fullName || "Your Name";

  return (
    <div style={{ fontSize: 13, fontFamily: "'Open Sans', sans-serif", display: "flex", width: 794, minHeight: 1123, backgroundColor: "#ffffff", padding: 24, boxSizing: "border-box" }}>
      <div style={{ width: "40%", padding: 24, color: "#1f2937" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, textTransform: "uppercase" }}>{name}</h1>
        {personal.title ? <p style={{ color: "#66cc99", fontSize: "0.75rem", marginBottom: 12 }}>{personal.title}</p> : null}
        <div style={{ marginTop: 12, color: "#6b7280", fontSize: "0.75rem" }}>
          {[personal.email, personal.phone, personal.location, personal.website, personal.linkedin, personal.github]
            .filter(Boolean)
            .map((line, i) => (
              <p key={i} style={{ marginBottom: 4 }}>{line}</p>
            ))}
        </div>
        {data.summary ? (
          <div style={{ marginTop: 16 }}>
            <h2 style={{ fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase", color: "#6b7280", marginBottom: 4 }}>Summary</h2>
            <p style={{ color: "#4b5563", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{data.summary}</p>
          </div>
        ) : null}
        {data.education.length ? (
          <div style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase", color: "#6b7280", marginBottom: 8 }}>Education</h2>
            {data.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <p style={{ fontWeight: 600, color: "#1f2937" }}>{edu.degree}</p>
                <p style={{ color: "#6b7280", fontSize: "0.75rem" }}>{edu.school}{edu.year ? ` — ${edu.year}` : ""}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div style={{ width: "60%", backgroundColor: "#3d3e42", color: "#c0c7cc", padding: 24 }}>
        <h2 style={{ color: "#ffffff", fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase", marginBottom: 12 }}>Experience</h2>
        {data.experience.map((exp, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <p style={{ color: "#ffffff", fontWeight: 600 }}>{exp.role}</p>
            <p style={{ color: "#66cc99", fontSize: "0.75rem", marginBottom: 4 }}>{exp.company}{exp.dates ? ` | ${exp.dates}` : ""}</p>
            <ul style={{ listStyleType: "disc", listStylePosition: "inside", fontSize: "0.75rem", margin: 0, padding: 0 }}>
              {exp.bullets.map((b, j) => <li key={j}>{b}</li>)}
            </ul>
          </div>
        ))}
        {data.projects.length ? (
          <div style={{ marginTop: 20 }}>
            <h2 style={{ color: "#ffffff", fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase", marginBottom: 12 }}>Projects</h2>
            {data.projects.map((proj, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <p style={{ color: "#ffffff", fontWeight: 600 }}>{proj.title}</p>
                <p style={{ fontSize: "0.75rem", marginTop: 2 }}>{proj.description}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
