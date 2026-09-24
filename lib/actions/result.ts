import type { z } from "zod";

/** What a form's server action returns to `useActionState`. */
export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error?: string; fieldErrors?: Record<string, string> };

export const IDLE: ActionResult | null = null;

/** First message per field, keyed by the form field name. */
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    out[key] ??= issue.message;
  }
  return out;
}

export function invalid(error: z.ZodError): ActionResult {
  const fieldErrors = fieldErrorsFrom(error);
  return { ok: false, error: fieldErrors._form ?? "Check the highlighted fields.", fieldErrors };
}

/**
 * FormData to a plain object for Zod. Repeated keys (checkbox groups) become arrays; a key
 * ending in "[]" is always an array.
 */
export function formObject(formData: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of new Set(formData.keys())) {
    if (key.startsWith("$ACTION")) continue;
    const values = formData.getAll(key).map((v) => (typeof v === "string" ? v : v.name));
    if (key.endsWith("[]")) out[key.slice(0, -2)] = values;
    else out[key] = values.length > 1 ? values : values[0];
  }
  return out;
}
