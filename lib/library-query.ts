/**
 * Query language for the admin Library.
 *
 *   type=essay,note     status=draft,published
 *   persona=builder     sort=updated,desc
 *
 * A token becomes a filter pill when followed by a space. Anything that is not
 * a valid token is treated as free text and matched against title, slug,
 * author, and persona.
 */

export type LibraryFilterKey = "type" | "status" | "persona";

export interface LibraryFilterToken {
  key: LibraryFilterKey;
  values: string[];
}

export type LibrarySortField =
  | "date"
  | "updated"
  | "title"
  | "type"
  | "status"
  | "persona";

export type LibrarySortDirection = "asc" | "desc";

export interface LibrarySort {
  field: LibrarySortField;
  direction: LibrarySortDirection;
}

export type ParsedLibraryToken =
  | { kind: "filter"; token: LibraryFilterToken }
  | { kind: "sort"; sort: LibrarySort };

const TYPE_ALIASES: Record<string, string> = {
  essay: "post",
  essays: "post",
  post: "post",
  posts: "post",
  note: "note",
  notes: "note",
  now: "now",
  book: "book",
  books: "book",
};

const STATUS_ALIASES: Record<string, string> = {
  published: "published",
  pub: "published",
  draft: "unpublished",
  drafts: "unpublished",
  unpublished: "unpublished",
  current: "current",
  past: "past",
};

const PERSONA_ALIASES: Record<string, string> = {
  builder: "builder",
  operator: "operator",
  thinker: "thinker",
  wanderer: "wanderer",
};

const FILTER_KEYS: Record<string, LibraryFilterKey> = {
  type: "type",
  types: "type",
  kind: "type",
  status: "status",
  persona: "persona",
};

const VALUE_ALIASES: Record<LibraryFilterKey, Record<string, string>> = {
  type: TYPE_ALIASES,
  status: STATUS_ALIASES,
  persona: PERSONA_ALIASES,
};

const SORT_FIELDS: Record<string, LibrarySortField> = {
  date: "date",
  published: "date",
  updated: "updated",
  modified: "updated",
  title: "title",
  name: "title",
  type: "type",
  kind: "type",
  status: "status",
  persona: "persona",
};

const SORT_DIRECTIONS: Record<string, LibrarySortDirection> = {
  asc: "asc",
  ascending: "asc",
  desc: "desc",
  descending: "desc",
};

export const FILTER_LABELS: Record<LibraryFilterKey, string> = {
  type: "Type",
  status: "Status",
  persona: "Persona",
};

const VALUE_LABELS: Record<string, string> = {
  post: "Essay",
  note: "Note",
  now: "Now",
  book: "Book",
  published: "Published",
  unpublished: "Draft",
  current: "Current",
  past: "Past",
  builder: "Builder",
  operator: "Operator",
  thinker: "Thinker",
  wanderer: "Wanderer",
};

export function tokenValueLabel(value: string): string {
  return VALUE_LABELS[value] ?? value;
}

export function formatLibraryToken(token: LibraryFilterToken): string {
  return `${FILTER_LABELS[token.key]}: ${token.values
    .map(tokenValueLabel)
    .join(", ")}`;
}

export function parseLibraryToken(raw: string): ParsedLibraryToken | null {
  const match = /^([a-z]+)=(.+)$/i.exec(raw.trim());
  if (!match) return null;

  const key = match[1].toLowerCase();
  const parts = match[2]
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  if (parts.length === 0) return null;

  if (key === "sort" || key === "sortby") {
    if (parts.length > 2) return null;
    const field = SORT_FIELDS[parts[0]];
    if (!field) return null;
    const direction = parts[1]
      ? SORT_DIRECTIONS[parts[1]]
      : field === "date" || field === "updated"
        ? "desc"
        : "asc";
    if (!direction) return null;
    return { kind: "sort", sort: { field, direction } };
  }

  const filterKey = FILTER_KEYS[key];
  if (!filterKey) return null;

  const values = parts.map((part) => VALUE_ALIASES[filterKey][part]);
  if (values.some((value) => !value)) return null;

  return {
    kind: "filter",
    token: { key: filterKey, values: [...new Set(values as string[])] },
  };
}

/** Same-key tokens merge (OR); different keys are kept separate (AND). */
export function mergeLibraryFilterTokens(
  tokens: LibraryFilterToken[],
  incoming: LibraryFilterToken,
): LibraryFilterToken[] {
  const existing = tokens.find((token) => token.key === incoming.key);
  if (!existing) return [...tokens, incoming];

  return tokens.map((token) =>
    token.key === incoming.key
      ? { key: token.key, values: [...new Set([...token.values, ...incoming.values])] }
      : token,
  );
}
