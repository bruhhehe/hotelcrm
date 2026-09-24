/** Two-letter avatar initials from a display name, falling back to the email's local part. */
export function initialsFor(name: string | null | undefined, email: string): string {
  const source = name?.trim() || email.split("@")[0] || "?";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : (parts[0]?.[1] ?? "");
  return (first + second).toUpperCase();
}

export function firstNameFor(name: string | null | undefined, email: string): string {
  const fromName = name?.trim().split(/\s+/)[0];
  if (fromName) return fromName;
  const local = email.split("@")[0] ?? "";
  const word = local.split(/[._-]+/)[0] ?? "";
  return word ? word[0]!.toUpperCase() + word.slice(1) : "there";
}
