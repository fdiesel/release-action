import { describe, expect, test } from '@jest/globals';
import { determineNextVersion } from '../../src/lib/utils';
import { Phase, SemVer } from '../../src/lib/version';
import { TestCommit } from './commit.test';

function createCommit(message: string): TestCommit {
  return new TestCommit(message);
}

describe('utils', () => {
  describe('determin next version', () => {
    test('should return inital dev version without commits', () => {
      const nextVersion = determineNextVersion(undefined, [], Phase.Dev);
      expect(nextVersion).not.toBeNull();
      expect(nextVersion?.toString()).toBe('0.1.0');
    });
    test('should return initial dev version independent of commits', () => {
      const nextVersion = determineNextVersion(
        undefined,
        ['feat!: add breaking feature', 'feat: add feature', 'fix: bug'].map(
          createCommit
        ),
        Phase.Dev
      );
      expect(nextVersion).not.toBeNull();
      expect(nextVersion?.toString()).toBe('0.1.0');
    });
    test('should return initial dev alpha version', () => {
      const nextVersion = determineNextVersion(
        undefined,
        ['feat: add feature (alpha)'].map(createCommit),
        Phase.Dev
      );
      expect(nextVersion).not.toBeNull();
      expect(nextVersion?.toString()).toBe('0.1.0-alpha');
    });
    test('should return initial prod version independet of commits', () => {
      const nextVersion = determineNextVersion(
        undefined,
        ['feat!: add breaking feature', 'feat: add feature', 'fix: bug'].map(
          createCommit
        ),
        Phase.Prod
      );
      expect(nextVersion).not.toBeNull();
      expect(nextVersion?.toString()).toBe('1.0.0');
    });
    test('should return initial prod rc version', () => {
      const nextVersion = determineNextVersion(
        undefined,
        ['fix: bug (rc)'].map(createCommit),
        Phase.Prod
      );
      expect(nextVersion).not.toBeNull();
      expect(nextVersion?.toString()).toBe('1.0.0-rc');
    });
    test('should bump from dev 0.y.z to prod 1.0.0', () => {
      const nextVersion = determineNextVersion(
        new SemVer(0, 2, 3),
        ['fix: bug'].map(createCommit),
        Phase.Prod
      );
      expect(nextVersion).not.toBeNull();
      expect(nextVersion?.toString()).toBe('1.0.0');
    });
    test('should bump pre-release', () => {
      const nextVersion = determineNextVersion(
        new SemVer(0, 1, 0),
        ['fix: bug (alpha)'].map(createCommit),
        Phase.Dev
      );
      expect(nextVersion).not.toBeNull();
      expect(nextVersion?.toString()).toBe('0.1.0-alpha');
    });
    test('should bump patch', () => {
      const nextVersion = determineNextVersion(
        new SemVer(0, 1, 0),
        ['fix: bug'].map(createCommit),
        Phase.Dev
      );
      expect(nextVersion).not.toBeNull();
      expect(nextVersion?.toString()).toBe('0.1.1');
    });
    test('should bump minor', () => {
      const nextVersion = determineNextVersion(
        new SemVer(0, 1, 0),
        ['feat: add feature'].map(createCommit),
        Phase.Dev
      );
      expect(nextVersion).not.toBeNull();
      expect(nextVersion?.toString()).toBe('0.2.0');
    });
    test('should bump major', () => {
      const nextVersion = determineNextVersion(
        new SemVer(1, 0, 0),
        ['feat!: add breaking feature'].map(createCommit),
        Phase.Prod
      );
      expect(nextVersion).not.toBeNull();
      expect(nextVersion?.toString()).toBe('2.0.0');
    });
    test('should not bump major for breaking change on dev', () => {
      const nextVersion = determineNextVersion(
        new SemVer(0, 1, 0),
        ['feat!: add breaking feature'].map(createCommit),
        Phase.Dev
      );
      expect(nextVersion).not.toBeNull();
      expect(nextVersion?.toString()).toBe('0.2.0');
    });
    test('should not return a new version for no commits', () => {
      const nextVersion = determineNextVersion(
        new SemVer(1, 0, 0),
        [],
        Phase.Prod
      );
      expect(nextVersion).toBeNull();
    });
    test('should not return a new version for no relevant changes', () => {
      const nextVersion = determineNextVersion(
        new SemVer(1, 0, 0),
        ['chore: something'].map(createCommit),
        Phase.Prod
      );
      expect(nextVersion).toBeNull();
    });
  });
});
