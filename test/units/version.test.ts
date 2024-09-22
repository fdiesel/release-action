import { describe, expect, test } from '@jest/globals';
import {
  BumpTarget,
  SemVer,
  SemVerPreRelease,
  SemVerPreReleaseName
} from '../../src/lib/version';

describe('SemVer', () => {
  describe('parse', () => {
    test('should parse 1.2.3', () => {
      expect(() => SemVer.parse('1.2.3')).not.toThrow();
    });
    test('should parse 1.2.3-alpha', () => {
      expect(() => SemVer.parse('1.2.3-alpha')).not.toThrow();
    });
    test('should parse 1.2.3-alpha.1', () => {
      expect(() => SemVer.parse('1.2.3-alpha.1')).not.toThrow();
    });
    test('should parse 1.2.3-alpha.0', () => {
      expect(() => SemVer.parse('1.2.3-alpha.0')).not.toThrow();
    });
    test('should set attributes correctly for parsing 1.2.3', () => {
      const version = SemVer.parse('1.2.3');
      expect(version.major).toBe(1);
      expect(version.minor).toBe(2);
      expect(version.patch).toBe(3);
      expect(version.preRelease).toBeNull();
    });
    test('should set attributes correctly for parsing 1.2.3-alpha.1', () => {
      const version = SemVer.parse('1.2.3-alpha.1');
      expect(version.major).toBe(1);
      expect(version.minor).toBe(2);
      expect(version.patch).toBe(3);
      expect(version.preRelease).not.toBeNull();
      expect(version.preRelease?.name).toBe('alpha');
      expect(version.preRelease?.version).toBe(1);
    });
    test('should set attributes correctly for parsing 1.2.3-alpha', () => {
      const version = SemVer.parse('1.2.3-alpha');
      expect(version.major).toBe(1);
      expect(version.minor).toBe(2);
      expect(version.patch).toBe(3);
      expect(version.preRelease).not.toBeNull();
      expect(version.preRelease?.name).toBe('alpha');
      expect(version.preRelease?.version).toBe(0);
    });
  });
  describe('to string', () => {
    test('should return 1.2.3 for 1.2.3', () => {
      const version = new SemVer(1, 2, 3);
      expect(version.toString()).toBe('1.2.3');
    });
    test('should return 1.2.3-alpha.1 for 1.2.3-alpha.1', () => {
      const version = new SemVer(
        1,
        2,
        3,
        new SemVerPreRelease(SemVerPreReleaseName.Alpha, 1)
      );
      expect(version.toString()).toBe('1.2.3-alpha.1');
    });
    test('should return 1.2.3-alpha for 1.2.3-alpha.0', () => {
      const version = new SemVer(
        1,
        2,
        3,
        new SemVerPreRelease(SemVerPreReleaseName.Alpha, 0)
      );
      expect(version.toString()).toBe('1.2.3-alpha');
    });
    test('should return 1.2.3-alpha for 1.2.3-alpha', () => {
      const version = new SemVer(
        1,
        2,
        3,
        new SemVerPreRelease(SemVerPreReleaseName.Alpha)
      );
      expect(version.toString()).toBe('1.2.3-alpha');
    });
  });
  describe('bump', () => {
    test('should bump major', () => {
      const prev = new SemVer(1, 2, 3);
      const next = SemVer.bump(prev, BumpTarget.Major);
      expect(next.major).toBe(2);
    });
    test('should bump minor', () => {
      const prev = new SemVer(1, 2, 3);
      const next = SemVer.bump(prev, BumpTarget.Minor);
      expect(next.minor).toBe(3);
    });
    test('should bump patch', () => {
      const prev = new SemVer(1, 2, 3);
      const next = SemVer.bump(prev, BumpTarget.Patch);
      expect(next.patch).toBe(4);
    });
    test('should bump alpha', () => {
      const prev = new SemVer(1, 2, 3);
      const next = SemVer.bump(prev, BumpTarget.Alpha);
      expect(next.preRelease?.name).toBe('alpha');
    });
    test('should bump beta', () => {
      const prev = new SemVer(1, 2, 3);
      const next = SemVer.bump(prev, BumpTarget.Beta);
      expect(next.preRelease?.name).toBe('beta');
    });
    test('should bump rc', () => {
      const prev = new SemVer(1, 2, 3);
      const next = SemVer.bump(prev, BumpTarget.Rc);
      expect(next.preRelease?.name).toBe('rc');
    });
    test('should bump alpha pre-release version', () => {
      const prev = new SemVer(
        1,
        2,
        3,
        new SemVerPreRelease(SemVerPreReleaseName.Alpha, 0)
      );
      const next = SemVer.bump(prev, BumpTarget.Alpha);
      expect(next.preRelease?.name).toBe(SemVerPreReleaseName.Alpha);
      expect(next.preRelease?.version).toBe(1);
    });
    test('should bump alpha to beta', () => {
      const prev = new SemVer(
        1,
        2,
        3,
        new SemVerPreRelease(SemVerPreReleaseName.Alpha)
      );
      const next = SemVer.bump(prev, BumpTarget.Beta);
      expect(next.preRelease?.name).toBe(SemVerPreReleaseName.Beta);
      expect(next.preRelease?.version).toBe(0);
    });
  });
});
