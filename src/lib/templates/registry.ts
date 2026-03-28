import type { ParamSchema } from "@/lib/types";

export type Template = {
  id: string;
  name: string;
  description: string;
  schema: ParamSchema;
  code: string;
};
