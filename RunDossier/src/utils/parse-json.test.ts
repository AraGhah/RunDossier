import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseJsonFromLLM, LLMJsonParseError } from './parse-json.js';

describe('parseJsonFromLLM — tolerant parsing', () => {
  it('parses clean JSON', () => {
    assert.deepEqual(parseJsonFromLLM('{"a":1}'), { a: 1 });
  });

  it('strips ```json markdown code fences', () => {
    const text = 'Here you go:\n```json\n{"variants":[{"subject":"s"}]}\n```\nThanks!';
    assert.deepEqual(parseJsonFromLLM(text), { variants: [{ subject: 's' }] });
  });

  it('strips bare ``` fences', () => {
    assert.deepEqual(parseJsonFromLLM('```\n[1,2,3]\n```'), [1, 2, 3]);
  });

  it('extracts a JSON object embedded in surrounding prose', () => {
    const text = 'Sure! {"confidence_score": 80, "research_summary": "x"} — let me know.';
    assert.deepEqual(parseJsonFromLLM(text), { confidence_score: 80, research_summary: 'x' });
  });

  it('extracts a JSON array embedded in prose', () => {
    assert.deepEqual(parseJsonFromLLM('Result: [{"variant_number":1}] done'), [{ variant_number: 1 }]);
  });

  it('tolerates trailing commas', () => {
    assert.deepEqual(parseJsonFromLLM('{"a":1,"b":[1,2,],}'), { a: 1, b: [1, 2] });
  });

  it('throws LLMJsonParseError carrying the raw output when there is no JSON (the Travis case)', () => {
    const prose = '**Subject: Travis – profitable growth engine**\n\nHey Travis,\n\nExiting JackedScholar...';
    assert.throws(
      () => parseJsonFromLLM(prose),
      (err: unknown) => {
        assert.ok(err instanceof LLMJsonParseError);
        assert.equal((err as LLMJsonParseError).raw, prose);
        assert.match((err as Error).message, /Failed to parse JSON/);
        return true;
      }
    );
  });

  it('throws on empty input and keeps raw', () => {
    assert.throws(() => parseJsonFromLLM('   '), (err: unknown) => err instanceof LLMJsonParseError);
  });

  it('does not return bare scalars/null as a valid structure', () => {
    assert.throws(() => parseJsonFromLLM('null'), (err: unknown) => err instanceof LLMJsonParseError);
    assert.throws(() => parseJsonFromLLM('42'), (err: unknown) => err instanceof LLMJsonParseError);
  });
});
