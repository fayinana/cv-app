import React from "react";
import type { CVData } from "./types";
import { TemplateClassic } from "./template-classic";
import { TemplateModern } from "./template-modern";
import { TemplateMinimal } from "./template-minimal";

export type TemplateId = "classic" | "modern" | "minimal";
export type { CVData } from "./types";

export const TEMPLATE_MAP: Record<TemplateId, React.ComponentType<{ data: CVData }>> = {
  classic: TemplateClassic,
  modern: TemplateModern,
  minimal: TemplateMinimal,
};
