/**
 * Turns a JSON Schema into a compact example of the expected JSON shape. Small models follow a
 * concrete example far better than a schema: they stop dropping the braces of objects inside arrays.
 */
type JsonSchema = {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  enum?: unknown[];
  const?: unknown;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  minimum?: number;
  maximum?: number;
};

function hint(s: JsonSchema): string {
  if (s.const !== undefined) return JSON.stringify(s.const);
  if (s.enum) return s.enum.map((v) => JSON.stringify(v)).join(" | ");
  return "";
}

export function schemaSkeleton(schema: JsonSchema, depth = 0): unknown {
  if (depth > 8) return "…";
  if (s_isConst(schema)) return schema.const;
  const variants = schema.anyOf ?? schema.oneOf;
  if (variants) {
    const nonNull = variants.filter((v) => v.type !== "null");
    const nullable = nonNull.length < variants.length;
    const first = nonNull[0] ? schemaSkeleton(nonNull[0], depth + 1) : null;
    return nullable && typeof first === "string" ? `${first} (or null)` : first;
  }
  const type = Array.isArray(schema.type) ? schema.type.find((t) => t !== "null") : schema.type;
  if (schema.enum) return `<one of: ${hint(schema)}>`;
  switch (type) {
    case "object": {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(schema.properties ?? {})) out[k] = schemaSkeleton(v, depth + 1);
      return out;
    }
    case "array": {
      const item = schema.items ?? {};
      const itemVariants = item.anyOf ?? item.oneOf;
      const range = `${schema.minItems ?? 0}–${schema.maxItems ?? "n"} items`;
      // Arrays of alternatives (e.g. page blocks): show one example of every variant.
      if (itemVariants && itemVariants.length > 1) return itemVariants.map((v) => schemaSkeleton(v, depth + 1));
      const example = schemaSkeleton(item, depth + 1);
      // Never add a second fake element: a model could copy it as real content.
      return typeof example === "string" && example.startsWith("<") ? [`<${range} of: ${example.slice(1)}`] : [example];
    }
    case "string":
      return schema.maxLength ? `<text, max ${schema.maxLength} chars>` : "<text>";
    case "integer":
      return "<integer>";
    case "number":
      return "<number>";
    case "boolean":
      return "<true | false>";
    default:
      return "<value>";
  }
}

function s_isConst(s: JsonSchema): s is JsonSchema & { const: unknown } {
  return s.const !== undefined;
}
