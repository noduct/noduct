import { describe, expect, it } from 'vitest';
import { cleanText } from './clean-text';
describe('cleanText', () => { it('normalizes spaces and excessive blank lines', () => expect(cleanText('  one   two\n\n\nthree  ')).toBe('one two\n\nthree')); });
