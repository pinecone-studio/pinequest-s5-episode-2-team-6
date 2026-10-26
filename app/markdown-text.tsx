/** Small Markdown renderer for assistant replies.
 *
 * The prompt asks the model for plain Markdown without tables or HTML. This
 * covers headings, paragraphs, lists, bold, italic, inline code, code blocks and
 * safe http(s) links, which is enough for a compact chat bubble and avoids
 * adding a Markdown dependency to the bundle. */

import type {ReactNode} from 'react';

const INLINE = /(\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`|\*[^*\n]+\*|_[^_\n]+_|\[[^\]]+\]\([^)]+\))/g;

const SUBSCRIPT: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
  '+': '₊',
  '-': '₋',
  '=': '₌',
  '(': '₍',
  ')': '₎',
};

const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
  '=': '⁼',
  '(': '⁽',
  ')': '⁾',
};

const LATEX_SYMBOLS: Record<string, string> = {
  times: '×',
  cdot: '·',
  pm: '±',
  mp: '∓',
  to: '→',
  rightarrow: '→',
  leftarrow: '←',
  le: '≤',
  leq: '≤',
  ge: '≥',
  geq: '≥',
  approx: '≈',
  neq: '≠',
  ne: '≠',
  degree: '°',
  circ: '°',
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  mu: 'μ',
};

function toScript(value: string, table: Record<string, string>): string {
  return [...value].map(character => table[character] ?? character).join('');
}

/** Turn simple inline LaTeX into readable text because the panel has no math renderer. */
function latexToText(body: string): string {
  let text = body;
  for (let pass = 0; pass < 3; pass += 1) {
    text = text.replace(/\\(?:text|mathrm|mathbf|mathit|operatorname)\{([^{}]*)\}/g, '$1');
  }
  text = text.replace(/\\(?:left|right)/g, '');
  text = text.replace(/\\([a-zA-Z]+)/g, (_, name: string) => LATEX_SYMBOLS[name] ?? ' ');
  text = text.replace(/[{}]/g, '');
  text = text.replace(/_\{([^{}]+)\}/g, (_, value: string) => toScript(value, SUBSCRIPT));
  text = text.replace(/\^\{([^{}]+)\}/g, (_, value: string) => toScript(value, SUPERSCRIPT));
  text = text.replace(/_([0-9a-zA-Z+\-=()])/g, (_, value: string) => SUBSCRIPT[value] ?? value);
  text = text.replace(/\^([0-9a-zA-Z+\-=()])/g, (_, value: string) => SUPERSCRIPT[value] ?? value);
  return text.replace(/\s+/g, ' ').trim();
}

function normalizeMath(value: string): string {
  return value
    .replace(/\$\$([^$\n]+)\$\$/g, (match, body: string) => (/\\[a-zA-Z]+|[_^]/.test(body) ? latexToText(body) : match))
    .replace(/\$([^$\n]+)\$/g, (match, body: string) => (/\\[a-zA-Z]+|[_^]/.test(body) ? latexToText(body) : match));
}

/** Collapse nested emphasis such as **text (*latin*)** into a form the inline parser handles. */
function normalizeEmphasis(value: string): string {
  return value
    .replace(/\*\*\*([^*\n]+)\*\*\*/g, '**$1**')
    .replace(/\*\*([^*\n]*?)\*([^*\n]+)\*([^*\n]*?)\*\*/g, '**$1$2$3**')
    .replace(/\*([^*\n]*?)\*\*([^*\n]+)\*\*([^*\n]*?)\*/g, '*$1$2$3*');
}


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
  const source = normalizeEmphasis(normalizeMath(text.replace(/\r\n/g, '\n')));
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

    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      blocks.push(<hr key={`hr-${blocks.length}`} className="ai-rule" />);
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
        /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(current) ||
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
