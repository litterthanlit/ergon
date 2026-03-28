import type { ParamSchema } from "@/lib/types";

export type Template = {
  id: string;
  name: string;
  description: string;
  schema: ParamSchema;
  code: string;
};

import { drift } from "./drift";
import { grid } from "./grid";
import { pulse } from "./pulse";
import { scatter } from "./scatter";
import { weave } from "./weave";

export const templates: Template[] = [drift, grid, pulse, scatter, weave];

export function getTemplate(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}
