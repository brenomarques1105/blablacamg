import { Fragment, type ReactNode } from "react";

// The assistant uses paragraphs, lists, bold, emphasis and links. React escapes
// all text; raw HTML and remote images are intentionally never rendered.
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^\s)]+\))/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const href = /^https?:\/\//i.test(link[2]) ? link[2] : undefined;
      return href ? <a key={i} href={href} target="_blank" rel="noopener noreferrer">{link[1]}</a> : <Fragment key={i}>{link[1]}</Fragment>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function ChatMarkdown({ text }: { text: string }) {
  return <>{text.split(/\n\s*\n/).map((block, index) => {
    const lines = block.split("\n");
    if (lines.every((line) => /^\s*[-*] /.test(line))) {
      return <ul className="list-disc" key={index}>{lines.map((line, i) => <li key={i}>{inline(line.replace(/^\s*[-*] /, ""))}</li>)}</ul>;
    }
    if (lines.every((line) => /^\s*\d+\. /.test(line))) {
      return <ol className="list-decimal" key={index}>{lines.map((line, i) => <li key={i}>{inline(line.replace(/^\s*\d+\. /, ""))}</li>)}</ol>;
    }
    return <p className="whitespace-pre-line" key={index}>{inline(block)}</p>;
  })}</>;
}
