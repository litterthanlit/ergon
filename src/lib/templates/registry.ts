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
import { spiral } from "./spiral";
import { waves } from "./waves";
import { constellation } from "./constellation";
import { terrain } from "./terrain";
import { bloom } from "./bloom";
import { glitch } from "./glitch";
import { mesh } from "./mesh";
import { aurora } from "./aurora";
import { flowfield } from "./flowfield";
import { particles } from "./particles";

export const templates: Template[] = [
  drift,
  grid,
  pulse,
  scatter,
  weave,
  spiral,
  waves,
  constellation,
  terrain,
  bloom,
  glitch,
  mesh,
  aurora,
  flowfield,
  particles,
];

export function getTemplate(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}
