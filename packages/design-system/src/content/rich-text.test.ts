import { describe, expect, it } from 'vitest';
import { fillPlaceholders, parseRichText } from './rich-text';

describe('parseRichText', () => {
  it('keeps plain text as a single part', () => {
    expect(parseRichText('Add two PDF files.')).toEqual([{ type: 'text', value: 'Add two PDF files.' }]);
  });

  it('marks system terms and action labels without leftover markers', () => {
    expect(
      parseRichText('Pick files from **Local Workspace**, then press `Merge PDF files`.')
    ).toEqual([
      { type: 'text', value: 'Pick files from ' },
      { type: 'strong', value: 'Local Workspace' },
      { type: 'text', value: ', then press ' },
      { type: 'code', value: 'Merge PDF files' },
      { type: 'text', value: '.' }
    ]);
  });
});

describe('fillPlaceholders', () => {
  it('substitutes named values used in instruction copy', () => {
    expect(fillPlaceholders('Press `{action}`.', { action: 'Merge PDF files' })).toBe(
      'Press `Merge PDF files`.'
    );
  });
});
