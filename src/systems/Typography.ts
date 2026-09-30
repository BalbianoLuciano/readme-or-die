/**
 * Our own line wrapping. Phaser never breaks lines: we do.
 *
 * - The rule is in characters, not pixels: `columns` is the maximum width of a line.
 *   With the game's monospaced font, one column is one character.
 * - Words are not split, unless a single word is longer than `columns`.
 * - No line ends with a space (sidesteps phaserjs/phaser#6860).
 * - Line breaks in the text are respected: each paragraph wraps separately and a blank
 *   line in the text produces a blank line in the output.
 *
 * `wrapSegments` is the version the Reader uses: the text comes in as segments, each with an
 * optional tag (the id of the fact it belongs to), and each output line is split into segments
 * that keep that tag. That is how the Reader knows which stretch of a line to underline or invert.
 */

export interface Segment {
  text: string;
  /** Id of the fact this stretch belongs to, or absent for plain text. */
  fact?: string;
}

export type Line = Segment[];

/** A word is a run of characters without spaces; each character knows which fact it belongs to. */
type Char = { ch: string; fact?: string };
type Word = Char[];

export function wrap(text: string, columns: number): string[] {
  return wrapSegments([{ text }], columns).map(lineText);
}

export function wrapSegments(segments: Segment[], columns: number): Line[] {
  if (!Number.isInteger(columns) || columns < 1) {
    throw new RangeError(`wrap: columns must be an integer ≥ 1, got ${columns}`);
  }
  const lines: Line[] = [];
  for (const paragraph of splitParagraphs(segments)) {
    lines.push(...wrapParagraph(paragraph, columns));
  }
  return lines;
}

export function lineText(line: Line): string {
  return line.map((s) => s.text).join('');
}

/** Cuts the segment list into paragraphs at every `\n`, keeping tags. */
function splitParagraphs(segments: Segment[]): Segment[][] {
  const paragraphs: Segment[][] = [[]];
  for (const seg of segments) {
    seg.text.split('\n').forEach((piece, i) => {
      if (i > 0) paragraphs.push([]);
      if (piece.length > 0) paragraphs[paragraphs.length - 1].push(segment(piece, seg.fact));
    });
  }
  return paragraphs;
}

function segment(text: string, fact?: string): Segment {
  return fact === undefined ? { text } : { text, fact };
}

/** Splits the paragraph into words. Spaces and tabs separate; everything else glues, tagged or not. */
function wordsOf(paragraph: Segment[]): Word[] {
  const words: Word[] = [];
  let current: Word = [];
  for (const seg of paragraph) {
    for (const ch of seg.text) {
      if (ch === ' ' || ch === '\t') {
        if (current.length > 0) words.push(current);
        current = [];
      } else {
        current.push(seg.fact === undefined ? { ch } : { ch, fact: seg.fact });
      }
    }
  }
  if (current.length > 0) words.push(current);
  return words;
}

function wrapParagraph(paragraph: Segment[], columns: number): Line[] {
  const words = wordsOf(paragraph);
  if (words.length === 0) return [[]];

  const lines: Line[] = [];
  let current: Char[] = [];
  for (const word of words) {
    for (const piece of splitWord(word, columns)) {
      if (current.length === 0) {
        current = [...piece];
      } else if (current.length + 1 + piece.length <= columns) {
        current.push({ ch: ' ' }, ...piece);
      } else {
        lines.push(group(current));
        current = [...piece];
      }
    }
  }
  lines.push(group(current));
  return lines;
}

/** Splits a word longer than `columns` into pieces of at most `columns`. */
function splitWord(word: Word, columns: number): Word[] {
  if (word.length <= columns) return [word];
  const pieces: Word[] = [];
  for (let i = 0; i < word.length; i += columns) pieces.push(word.slice(i, i + columns));
  return pieces;
}

/**
 * Turns the line of characters into segments, merging neighbours with the same tag.
 * A space between two stretches of the same fact belongs to the fact.
 */
function group(chars: Char[]): Line {
  const tags = chars.map((c, i) => {
    if (c.ch !== ' ' || c.fact !== undefined) return c.fact;
    const before = chars[i - 1]?.fact;
    const after = chars[i + 1]?.fact;
    return before !== undefined && before === after ? before : undefined;
  });
  const line: Line = [];
  chars.forEach((c, i) => {
    const last = line[line.length - 1];
    if (last && last.fact === tags[i]) last.text += c.ch;
    else line.push(segment(c.ch, tags[i]));
  });
  return line;
}
