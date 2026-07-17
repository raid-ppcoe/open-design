// od-card — attribute + form-answer parsing. These regexes were rewritten to
// remove polynomial (ReDoS) backtracking; the tests below lock in that the
// behavior is unchanged AND that hostile input returns quickly.
import { describe, expect, it } from 'vitest';
import { splitOnOdCards, parseFormAnswers } from '../src/artifacts/od-card.js';

describe('splitOnOdCards attribute parsing', () => {
  it('parses the type attribute and card body', () => {
    const segs = splitOnOdCards(
      'before <od-card type="task-brief">{ "summary": "Do it", "fields": [] }</od-card> after',
    );
    const card = segs.find((s) => s.kind === 'card');
    expect(card).toBeTruthy();
    if (card && card.kind === 'card') {
      expect(card.card.kind).toBe('task-brief');
      if (card.card.kind === 'task-brief') expect(card.card.summary).toBe('Do it');
    }
  });

  it('parses single-quoted attributes', () => {
    const segs = splitOnOdCards(
      "<od-card type='memory-applied'>{ \"summary\": \"Applied\", \"used\": [] }</od-card>",
    );
    expect(segs.some((s) => s.kind === 'card')).toBe(true);
  });

  it('returns quickly on a hostile all-word-char attribute run (no ReDoS)', () => {
    const hostile = `<od-card ${'a'.repeat(60000)}>body</od-card>`;
    const start = Date.now();
    splitOnOdCards(hostile);
    expect(Date.now() - start).toBeLessThan(1000);
  });
});

describe('parseFormAnswers', () => {
  it('parses a form-answers block and strips the [value: …] annotation', () => {
    const parsed = parseFormAnswers(
      '[form answers — discovery]\n- Platform: Responsive [value: responsive]\n- Audience: SaaS buyers',
    );
    expect(parsed).not.toBeNull();
    expect(parsed?.id).toBe('discovery');
    expect(parsed?.pairs).toEqual([
      { label: 'Platform', value: 'Responsive' },
      { label: 'Audience', value: 'SaaS buyers' },
    ]);
  });

  it('drops skipped answers', () => {
    const parsed = parseFormAnswers('[form answers]\n- A: (skipped)\n- B: kept');
    expect(parsed?.pairs).toEqual([{ label: 'B', value: 'kept' }]);
  });

  it('returns quickly on hostile whitespace-heavy lines (no ReDoS)', () => {
    const hostile = `[form answers${' '.repeat(60000)}\n-${' '.repeat(60000)}x`;
    const start = Date.now();
    parseFormAnswers(hostile);
    expect(Date.now() - start).toBeLessThan(1000);
  });
});
