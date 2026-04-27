
import { describe, it, expect } from 'vitest';

describe('Skipped test', () => {
    it('skips', () => {
        expect(true).toBe(true);
    });
});
