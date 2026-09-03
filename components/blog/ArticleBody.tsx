import Link from "next/link";
import type { ReactNode } from "react";
import type { ContentBlock } from "@/lib/articles";

/**
 * The article body renderer — the single source of truth for how blog prose
 * looks, whatever produced it.
 *
 * Both content sources arrive here as the same `ContentBlock[]`: the built-in
 * articles in `lib/articles.ts` declare theirs literally, and admin-authored
 * posts are parsed into it by `parseBody` before being stored. There is
 * deliberately no second style path for dashboard posts — if the two ever look
 * different, the cause is the content, not the rendering.
 *
 * Two wrapping rules matter here, because prose typed into a dashboard is not
 * as well-behaved as prose committed to a source file:
 *
 *   - `break-words` (`overflow-wrap: break-word`) lets a single unbroken token
 *     longer than the measure — a pasted URL, an accidental keyboard mash —
 *     break rather than push the whole page into horizontal scroll. CSS will
 *     not break such a token by default, so without this one word is enough to
 *     overflow the viewport.
 *   - `min-w-0` stops the body from claiming its widest child's width if it is
 *     ever placed inside a flex or grid parent.
 */

/** Inline marks, tried in order: link, bold, italic, code. */
const INLINE_PATTERN =
  /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|`([^`\n]+)`/g;

/**
 * Turns the inline conventions in a block's text into elements.
 *
 * Applied at render time rather than at save time, so the stored shape stays
 * exactly `{ type, text }` and nothing about the database had to change. The
 * built-in articles contain none of these markers, so they pass through this
 * function unchanged — which is what keeps them rendering byte-identically.
 */
function renderInline(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  // `matchAll` needs the global flag, which carries `lastIndex` state on the
  // regex object — so iterate a fresh matcher rather than the shared literal.
  for (const match of text.matchAll(INLINE_PATTERN)) {
    const start = match.index ?? 0;
    if (start > lastIndex) nodes.push(text.slice(lastIndex, start));

    const [full, linkText, linkHref, bold, italic, code] = match;

    if (linkText && linkHref) {
      const className =
        "font-medium text-burgundy underline decoration-burgundy/30 underline-offset-[3px] transition-colors hover:decoration-burgundy";
      // Site-relative links stay client-side navigations; anything external
      // opens in a new tab and never leaks the referrer's opener.
      nodes.push(
        linkHref.startsWith("/") ? (
          <Link key={key++} href={linkHref} className={className}>
            {linkText}
          </Link>
        ) : (
          <a
            key={key++}
            href={linkHref}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
          >
            {linkText}
          </a>
        ),
      );
    } else if (bold) {
      nodes.push(
        <strong key={key++} className="font-semibold text-ink">
          {bold}
        </strong>,
      );
    } else if (italic) {
      nodes.push(<em key={key++}>{italic}</em>);
    } else if (code) {
      nodes.push(
        <code
          key={key++}
          className="rounded-[3px] bg-beige-light px-1.5 py-0.5 font-mono text-[0.85em] text-charcoal"
        >
          {code}
        </code>,
      );
    }

    lastIndex = start + full.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));

  // A block with no markers returns the original string, not an array — one
  // less wrapper for the overwhelmingly common case.
  return nodes.length === 0 ? text : nodes.length === 1 ? nodes[0] : nodes;
}

/**
 * One content block.
 *
 * The class names are the ones the article page has always used; they are
 * reproduced here verbatim so moving the renderer into its own module is not a
 * visual change.
 */
function Block({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "h2":
      return (
        <h2 className="mt-14 font-serif text-3xl text-ink">{renderInline(block.text)}</h2>
      );
    case "h3":
      // Subheading: the same serif voice as h2, one step down in size and
      // spacing so the hierarchy reads without introducing a new style.
      return (
        <h3 className="mt-10 font-serif text-2xl text-ink">{renderInline(block.text)}</h3>
      );
    case "quote":
      return (
        <blockquote className="my-12 border-l-2 border-burgundy py-1 pl-7">
          <p className="font-serif text-2xl italic leading-snug text-ink md:text-[1.75rem]">
            {renderInline(block.text)}
          </p>
        </blockquote>
      );
    case "list":
      return (
        <ul className="my-6 flex flex-col gap-3">
          {block.items.map((item, i) => (
            // Indexed: two identical bullets in one list is legitimate prose.
            <li key={i} className="flex items-start gap-3">
              <span aria-hidden className="mt-3 h-px w-4 shrink-0 bg-burgundy" />
              <span className="min-w-0 text-lg leading-relaxed text-charcoal/85">
                {renderInline(item)}
              </span>
            </li>
          ))}
        </ul>
      );
    default:
      return (
        <p className="mt-6 text-lg leading-relaxed text-charcoal/85">
          {renderInline(block.text)}
        </p>
      );
  }
}

export function ArticleBody({ content }: { content: ContentBlock[] }) {
  return (
    <div className="min-w-0 text-pretty break-words">
      {content.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}
