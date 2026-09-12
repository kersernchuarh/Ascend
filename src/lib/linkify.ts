const URL_PATTERN = /(https?:\/\/[^\s]+)/g;
/** Trailing punctuation that's almost always sentence structure, not part
 *  of the URL itself ("see https://x.test, thanks" — the comma isn't the
 *  link). A closing bracket/paren is only trimmed if unbalanced within the
 *  match, so a URL that legitimately ends in one (a wiki page like
 *  "...(disambiguation)") keeps it. */
const TRAILING_PUNCTUATION = /[.,!?;:)\]]+$/;

export type LinkifyPart = { text: string; isLink: boolean };

function trimTrailingPunctuation(url: string): { url: string; trailing: string } {
  const match = url.match(TRAILING_PUNCTUATION);
  if (!match) return { url, trailing: "" };
  let trailing = match[0];
  let core = url.slice(0, url.length - trailing.length);
  while (trailing.startsWith(")") && (core.match(/\(/g)?.length ?? 0) > (core.match(/\)/g)?.length ?? 0)) {
    core += trailing[0];
    trailing = trailing.slice(1);
  }
  while (trailing.startsWith("]") && (core.match(/\[/g)?.length ?? 0) > (core.match(/\]/g)?.length ?? 0)) {
    core += trailing[0];
    trailing = trailing.slice(1);
  }
  return { url: core, trailing };
}

/**
 * Splits free text into plain-text and link segments, so a `Task.notes`
 * value that happens to contain a URL ("resource link" per
 * PRODUCT_BLUEPRINT.md §29) can be rendered with that URL clickable —
 * without inventing a separate `url` field on `Task` for the common case of
 * "one line of text that happens to be, or contain, a link". Pure and
 * framework-free so it's directly testable; `components/shared/linkified-text.tsx`
 * turns the result into JSX.
 */
export function splitLinkify(text: string): LinkifyPart[] {
  if (!text) return [];
  const parts: LinkifyPart[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const start = match.index ?? 0;
    if (start > lastIndex) parts.push({ text: text.slice(lastIndex, start), isLink: false });
    const { url, trailing } = trimTrailingPunctuation(match[0]);
    parts.push({ text: url, isLink: true });
    if (trailing) parts.push({ text: trailing, isLink: false });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex), isLink: false });
  return parts;
}
