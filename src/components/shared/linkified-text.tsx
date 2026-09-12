import { splitLinkify } from "@/lib/linkify";

/** Renders `Task.notes` with any plain URL auto-linked — see `lib/linkify.ts`. */
function LinkifiedText({ text, className }: { text: string; className?: string }) {
  const parts = splitLinkify(text);
  return (
    <p className={className}>
      {parts.map((part, index) =>
        part.isLink ? (
          <a
            key={index}
            href={part.text}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:text-primary/80"
            onClick={(event) => event.stopPropagation()}
          >
            {part.text}
          </a>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </p>
  );
}

export { LinkifiedText };
