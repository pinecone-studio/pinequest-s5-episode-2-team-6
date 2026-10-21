/** Монгол хэлээрх анагаадын контентын шалгалт.
 *  Ашиглах: node scripts/lint-mn.mjs
 *
 *  Зорьсон: app/mn/*.ts дахь монгол текстүүдийн дүрэмд нийцэх эсэхийг шалгана.
 *  Энэ нь граммар шалгагч биш — дүрэмтэй зөрчилдэх ерөнхий хэв маягийг илэрхийлэхэд ашиглана. */

import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';

const DIR = new URL('../app/mn/', import.meta.url).pathname;
const files = readdirSync(DIR).filter(name => name.endsWith('.ts') && name !== 'index.ts');

/** app/mn/*.ts доторх single quote доторх монгол текстүүдийг цуглуулна. */
function collectProse(source) {
  const prose = [];
  const body = source.slice(source.indexOf('export const'));
  const pattern = /'((?:[^'\\]|\\.){40,})'/g;
  let match;
  while ((match = pattern.exec(body)) !== null) {
    const text = match[1];
    if (!/[А-Яа-яӨөҮү]/.test(text)) continue;
    // Код, тэмдэглэгээ биш, үнэхээр монгол текст байх ёстой.
    if (/[={};<>]|\bexport\b|\bconst\b|\bRecord<|\binterface\b/.test(text)) continue;
    if (text.split(/\s+/).length < 8) continue;
    prose.push(text);
  }
  return prose;
}

/** Толь бичиг болох файл — утгууд нь бүтэн өгүүлбэр биш. */
const DICTIONARY_FILES = new Set(['terms.ts', 'glossary.ts']);

const problems = [];
const report = (file, kind, detail) => problems.push(`${file}: [${kind}] ${detail}`);

const englishWords = new Set(
  ('the of and in to for with without is are was were be been this that from on by as at it its not no ' +
   'more most less than then when which who whom whose can may might must shall should will would do does ' +
   'did have has had there their they them these those but or if so such into over under between')
    .split(' '),
);

/** Бүх quoted string (үг хэлбэртэй толь бичгийн утгуудыг оруулгаар). */
function collectAllStrings(source) {
  const out = [];
  const pattern = /'((?:[^'\\]|\\.){4,})'/g;
  let match;
  while ((match = pattern.exec(source)) !== null) out.push(match[1]);
  return out;
}

for (const file of files) {
  const source = readFileSync(join(DIR, file), 'utf8');

  // Давхардсан тэмдэглэгээтэй үг: «сувгийн сув», «бүтэцтэй бүтэц» зэрэг
  for (const text of collectAllStrings(source)) {
    if (!/[А-Яа-яӨөҮү]/.test(text)) continue;
    for (const m of text.matchAll(/([А-Яа-яӨөҮү]{3,})(ын|ийн|ны|гийн|тай|тэй|ы|ий)\s+\1(?![А-Яа-яӨөҮү])/g)) {
      report(file, 'давхар тэмдэглэгээ', `«${m[1]}${m[2]} ${m[1]}»`);
    }
  }

  for (const text of collectProse(source)) {
    // Давхардсан үг (үнэхээр давхардсан эсвэл "хамраа хамраа" гэсэн зэрэгцээ ижил үг)
    const words = text.split(/\s+/);
    for (let i = 1; i < words.length; i++) {
      const a = words[i - 1].replace(/[.,;:!?()"]/g, '').toLowerCase();
      const b = words[i].replace(/[.,;:()?!"-]/g, '').toLowerCase();
      if (a.length > 3 && a === b && !['хамраа', 'хадсан', 'дээд', 'доод'].includes(a)) {
        report(file, 'давхар үг', `…${words.slice(Math.max(0, i - 2), i + 2).join(' ')}…`);
      }
    }
    // Тоон завсарт "аас" хэрэглэсэн
    for (const m of text.matchAll(/(\d+)[-–](\d+)\s*аас/g)) {
      report(file, 'тоон завсар', `"${m[0]}" → "${m[1]}–${m[2]}"`);
    }
    // Хаалттай гаднах латин үг
    const withoutParentheses = text.replace(/\([^)]*\)/g, ' ');
    for (const m of withoutParentheses.matchAll(/\b([A-Za-z][A-Za-z'-]{2,})\b/g)) {
      const word = m[1].toLowerCase();
      if (englishWords.has(word)) report(file, 'англи үг', `"${m[1]}"`);
    }
    // Хаалтын тэнцэтгүй байдал
    const opens = (text.match(/\(/g) || []).length;
    const closes = (text.match(/\)/g) || []).length;
    if (opens !== closes) report(file, 'хаалт', `${opens} нээх / ${closes} хаах`);
    // Өгүүлбэр төгсгөлгүй (толь бичгийн утгууд бүр өгүүлбэр биш тул шалгахгүй)
    const trimmed = text.trim();
    if (!DICTIONARY_FILES.has(file) && !/[.!?]$/.test(trimmed)) report(file, 'цэг', `…${trimmed.slice(-40)}`);
    // Двойн зай
    if (/\s{2,}/.test(text)) report(file, 'двойн зай', '…' + text.slice(0, 40));
    // Эрэлзээтэй тэмдэглэгээ
    for (const m of text.matchAll(/(\d)-(\d)/g)) report(file, 'тире', `"${m[0]}" → "${m[1]}–${m[2]}"`);
  }
}

if (!problems.length) {
  console.log('Монгол контент: дүрэмтэй зөрчил олдсонгүй.');
} else {
  console.log(`Монгол контент: ${problems.length} ажиглалт:`);
  for (const problem of problems) console.log(' - ' + problem);
  process.exitCode = 1;
}
