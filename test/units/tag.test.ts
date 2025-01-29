import { describe, expect, test } from '@jest/globals';
import { SemVer } from 'semver';
import { Tag } from '../../src/lib/tag';

describe('tag', () => {
  describe('parse', () => {
    test('should parse 1.2.3', () => {
      expect(() => Tag.parseVersion('1.2.3')).not.toThrow();
    });
    test('should parse v1.2.3', () => {
      expect(() => Tag.parseTag('v1.2.3')).not.toThrow();
    });
  });
  describe('to string', () => {
    test('should return v1.2.3 for 1.2.3', () => {
      const version = new SemVer('1.2.3');
      const tag = new Tag(version);
      expect(tag.toString()).toBe('v1.2.3');
    });
  });
});
