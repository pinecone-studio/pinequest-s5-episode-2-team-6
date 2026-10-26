/** Small Markdown renderer for assistant replies.
 *
 * The prompt asks the model for plain Markdown without tables or HTML. This
 * covers headings, paragraphs, lists, bold, italic, inline code, code blocks and
 * safe http(s) links, which is enough for a compact chat bubble and avoids
 * adding a Markdown dependency to the bundle. */

import type {ReactNode} from 'react';

const INLINE = /(\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`|\*[^*\n]+\*|_[^_\n]+_|\[[^\]]+\]\([^)]+\))/g;

function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  INLINE.lastIndex = 0;
  while ((match = INLINE.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${match.index}`;
    if (token.startsWith('**') || token.startsWith('__')) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`')) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith('*') || token.startsWith('_')) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (link && /^https?:\/\//i.test(link[2])) {
        nodes.push(
          <a key={key} href={link[2]} target="_blank" rel="noreferrer">
            {link[1]}
          </a>,
        );
      } else {
        nodes.push(token);
      }
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function lines(text: string): ReactNode[] {
  return text.split('\n').flatMap((line, index) => [
    index > 0 ? <br key={`br-${index}`} /> : null,
    ...inline(line, `l-${index}`),
  ]);
}

function paragraph(text: string, key: string): ReactNode {
  return <p key={key}>{lines(text)}</p>;
}

function list(items: string[], ordered: boolean, key: string): ReactNode {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag key={key}>
      {items.map((item, index) => (
        <li key={`${key}-${index}`}>{inline(item, `${key}-${index}`)}</li>
      ))}
    </Tag>
  );
}

export default function MarkdownText({text}: {text: string}) {
  const blocks: ReactNode[] = [];
  const source = text.replace(/\r\n/g, '\n');
  const input = source.split('\n');
  let index = 0;

  const flushParagraph = (buffer: string[]) => {
    if (!buffer.length) return;
    blocks.push(paragraph(buffer.join('\n'), `p-${blocks.length}`));
    buffer.length = 0;
  };

  while (index < input.length) {
    const line = input[index];

    if (/^```/.test(line.trim())) {
      const code: string[] = [];
      index += 1;
      while (index < input.length && !/^```/.test(input[index].trim())) {
        code.push(input[index]);
        index += 1;
      }
      index += 1;
      blocks.push(
        <pre key={`pre-${blocks.length}`}>
          <code>{code.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      const Tag = heading[1].length <= 2 ? 'h3' : 'h4';
      blocks.push(
        <Tag key={`h-${blocks.length}`} className="ai-rich-heading">
          {inline(heading[2], `h-${blocks.length}`)}
        </Tag>,
      );
      index += 1;
      continue;
    }

    if (/^\s*[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (index < input.length && /^\s*[-*•]\s+/.test(input[index])) {
        items.push(input[index].replace(/^\s*[-*•]\s+/, ''));
        index += 1;
      }
      blocks.push(list(items, false, `ul-${blocks.length}`));
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (index < input.length && /^\s*\d+[.)]\s+/.test(input[index])) {
        items.push(input[index].replace(/^\s*\d+[.)]\s+/, ''));
        index += 1;
      }
      blocks.push(list(items, true, `ol-${blocks.length}`));
      continue;
    }

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const buffer: string[] = [];
    while (index < input.length) {
      const current = input[index];
      if (
        !current.trim() ||
        /^```/.test(current.trim()) ||
        /^(#{1,6})\s+/.test(current) ||
        /^\s*[-*•]\s+/.test(current) ||
        /^\s*\d+[.)]\s+/.test(current)
      ) {
        break;
      }
      buffer.push(current);
      index += 1;
    }
    flushParagraph(buffer);
  }

  return <div className="ai-rich">{blocks}</div>;
}
