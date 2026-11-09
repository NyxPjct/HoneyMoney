"use client";

import { Button, cn, Input, Select, Textarea } from "@honeymoney/ui";
import { Plus, Trash2 } from "lucide-react";
import { ENUM_OPTIONS, fieldLabel } from "@/lib/labels";

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const LONG_KEYS = new Set(["text", "body", "problem", "solution", "hook", "audienceProfile", "answer", "description", "primaryText", "guaranteeText", "rationale", "formatRationale"]);
const READONLY_KEYS = new Set(["type"]);

/** An empty value with the same shape, used when adding list items. */
export function blankLike(value: JsonValue | undefined): JsonValue {
  if (Array.isArray(value)) return [];
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, k === "type" ? v : blankLike(v)]));
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  return "";
}

type FieldProps = { fieldKey: string; value: JsonValue; onChange: (v: JsonValue) => void; depth?: number; path: string };

/** Generic, schema-agnostic editor for agent deliverables and page blocks. The server validates with Zod. */
export function JsonField({ fieldKey, value, onChange, depth = 0, path }: FieldProps) {
  const label = fieldLabel(fieldKey);
  const id = `f-${path}`.replace(/[^a-zA-Z0-9_-]/g, "-");

  if (READONLY_KEYS.has(fieldKey)) return null;

  if (typeof value === "string") {
    const options = ENUM_OPTIONS[fieldKey];
    return (
      <div className="space-y-1">
        <label htmlFor={id} className="text-xs font-medium text-stone-600 dark:text-stone-300">
          {label}
        </label>
        {options ? (
          <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
        ) : LONG_KEYS.has(fieldKey) || value.length > 70 ? (
          <Textarea id={id} value={value} rows={Math.min(10, Math.max(3, Math.ceil(value.length / 70)))} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
        )}
      </div>
    );
  }

  if (typeof value === "number") {
    return (
      <div className="space-y-1">
        <label htmlFor={id} className="text-xs font-medium text-stone-600 dark:text-stone-300">
          {label}
        </label>
        <Input id={id} type="number" value={value} onChange={(e) => onChange(Number(e.target.value || 0))} />
      </div>
    );
  }

  if (typeof value === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-amber-500" />
        {label}
      </label>
    );
  }

  if (Array.isArray(value)) {
    return (
      <fieldset className="space-y-2">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</legend>
        {value.map((item, i) => (
          <div key={i} className={cn("flex gap-2", typeof item === "object" && item !== null && "rounded-lg border border-stone-200 p-3 dark:border-stone-700")}>
            <div className="min-w-0 flex-1">
              <JsonField
                fieldKey={typeof item === "object" ? `${i + 1}` : `${label} ${i + 1}`}
                value={item}
                path={`${path}.${i}`}
                depth={depth + 1}
                onChange={(v) => onChange(value.map((old, j) => (j === i ? v : old)))}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remover item ${i + 1}`}
              onClick={() => onChange(value.filter((_, j) => j !== i))}
            >
              <Trash2 aria-hidden />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => onChange([...value, blankLike(value[value.length - 1])])}>
          <Plus aria-hidden />
          Adicionar
        </Button>
      </fieldset>
    );
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    const inner = (
      <div className="space-y-3">
        {entries.map(([k, v]) => (
          <JsonField key={k} fieldKey={k} value={v} path={`${path}.${k}`} depth={depth + 1} onChange={(nv) => onChange({ ...value, [k]: nv })} />
        ))}
      </div>
    );
    if (depth === 0 || /^\d+$/.test(fieldKey)) return inner;
    return (
      <fieldset className="space-y-3 rounded-lg border border-stone-200 p-3 dark:border-stone-700">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</legend>
        {inner}
      </fieldset>
    );
  }

  return null;
}

/** Read-only, human-friendly view of any deliverable. */
export function JsonView({ value, fieldKey = "", depth = 0 }: { value: unknown; fieldKey?: string; depth?: number }) {
  if (value === null || value === undefined || value === "") return <span className="text-stone-400">—</span>;
  if (typeof value === "string" || typeof value === "number") return <span className="whitespace-pre-line">{String(value)}</span>;
  if (typeof value === "boolean") return <span>{value ? "Sim" : "Não"}</span>;
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-stone-400">—</span>;
    if (value.every((v) => typeof v !== "object")) {
      return (
        <ul className="list-disc space-y-1 pl-5">
          {value.map((v, i) => (
            <li key={i}>{String(v)}</li>
          ))}
        </ul>
      );
    }
    return (
      <ol className="space-y-2">
        {value.map((v, i) => (
          <li key={i} className="rounded-lg border border-stone-200 p-3 dark:border-stone-700">
            <JsonView value={v} depth={depth + 1} />
          </li>
        ))}
      </ol>
    );
  }
  if (typeof value === "object") {
    return (
      <dl className={cn("space-y-3", depth > 0 && "text-sm")}>
        {Object.entries(value as Record<string, unknown>)
          .filter(([k]) => k !== "type")
          .map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">{fieldLabel(k)}</dt>
              <dd className="mt-0.5">
                <JsonView value={v} fieldKey={k} depth={depth + 1} />
              </dd>
            </div>
          ))}
      </dl>
    );
  }
  return <span>{fieldKey}</span>;
}
