import type { CVData } from "./types";

interface Props {
  data: CVData;
}

export function TemplateMinimal({ data }: Props) {
  const { personal } = data;
  const name = personal.fullName || "Your Name";
  const contactParts = [personal.email, personal.phone, personal.location, personal.website].filter(Boolean);
  return (
    <div style={{ fontSize: 13, fontFamily: "'Open Sans', sans-serif", width: 794, minHeight: 1123, backgroundColor: "#ffffff", padding: 24, boxSizing: "border-box" }}>
      <div style={{ backgroundColor: "#434E5E", color: "#ffffff", padding: "24px 28px" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>{name}</h1>
        {personal.title ? <p style={{ color: "#d1d5db", fontSize: "0.875rem", marginTop: 4 }}>{personal.title}</p> : null}
        {contactParts.length ? <p style={{ color: "#9ca3af", fontSize: "0.6875rem", marginTop: 8 }}>{contactParts.join("  •  ")}</p> : null}
        {data.summary ? <p style={{ color: "#d1d5db", fontSize: "0.75rem", marginTop: 10, lineHeight: 1.6 }}>{data.summary}</p> : null}
      </div>
      <div style={{ display: "flex" }}>
        <div style={{ width: "75%", padding: 24 }}>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", color: "#434E5E", marginBottom: 12, borderBottom: "2px solid #434E5E", paddingBottom: 4 }}>Experience</h2>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <p style={{ fontWeight: 600, color: "#111827" }}>{exp.role}</p>
                <span style={{ fontSize: "0.6875rem", color: "#9ca3af" }}>{exp.dates}</span>
              </div>
              <p style={{ color: "#58677c", fontSize: "0.75rem", marginBottom: 4 }}>{exp.company}</p>
              <ul style={{ listStyleType: "disc", listStylePosition: "inside", color: "#4b5563", fontSize: "0.75rem", margin: 0, padding: 0 }}>
                {exp.bullets.map((b, j) => <li key={j}>{b}</li>)}
              </ul>
            </div>
          ))}
          {data.projects.length ? (
            <>
              <h2 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", color: "#434E5E", marginTop: 16, marginBottom: 12, borderBottom: "2px solid #434E5E", paddingBottom: 4 }}>Projects</h2>
              {data.projects.map((proj, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <p style={{ fontWeight: 600, color: "#111827" }}>{proj.title}</p>
                  <p style={{ color: "#4b5563", fontSize: "0.75rem" }}>{proj.description}</p>
                </div>
              ))}
            </>
          ) : null}
        </div>
        <div style={{ width: "25%", padding: 24, backgroundColor: "#f9fafb" }}>
          <h2 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#434E5E", marginBottom: 8, borderBottom: "1px solid #d1d5db", paddingBottom: 4 }}>Education</h2>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <p style={{ fontWeight: 600, color: "#1f2937", fontSize: "0.75rem" }}>{edu.degree}</p>
              <p style={{ color: "#6b7280", fontSize: "0.6875rem" }}>{edu.school}{edu.year ? ` — ${edu.year}` : ""}</p>
            </div>
          ))}
          <h2 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#434E5E", marginTop: 18, marginBottom: 8, borderBottom: "1px solid #d1d5db", paddingBottom: 4 }}>Skills</h2>
          {data.skills.map((skill, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <p style={{ color: "#374151", fontSize: "0.75rem", marginBottom: 2 }}>{skill}</p>
              <div style={{ height: 6, backgroundColor: "#e5e7eb", borderRadius: 9999 }}>
                <div style={{ height: 6, backgroundColor: "#58677c", borderRadius: 9999, width: `${75 + ((i * 13) % 25)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
