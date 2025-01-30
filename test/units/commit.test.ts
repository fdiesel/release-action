import { describe, expect, test } from '@jest/globals';
import { Commit, ConventionalCommitMessage } from '../../src/lib/commit';

export class TestCommit extends Commit<undefined> {
  constructor(message: string) {
    super(undefined, message, 'sha', 'id', 'uri');
  }
}

describe('commit', () => {
  describe("conventional commit message", () => {
    describe('parse', () => {
      test('should parse feat', () => {
        expect(() =>
          ConventionalCommitMessage.parse('feat: add feature'),
        ).not.toThrow();
      });
      test('should parse fix', () => {
        expect(() =>
          ConventionalCommitMessage.parse('fix: fix bug'),
        ).not.toThrow();
      });
      test('should parse breaking change !', () => {
        expect(() =>
          ConventionalCommitMessage.parse('feat!: add feature'),
        ).not.toThrow();
      });
      test('should parse breaking change BREAKING CHANGE:', () => {
        const commitMessageString =
          'feat: add feature\n\nBREAKING CHANGE: this is a breaking change';
        expect(() =>
          ConventionalCommitMessage.parse(commitMessageString),
        ).not.toThrow();
        const commitMessage =
          ConventionalCommitMessage.parse(commitMessageString);
        expect(commitMessage.isBreakingChange).toBe(true);
      });
      test('should parse breaking change BREAKING-CHANGE:', () => {
        const commitMessageString =
          'feat: add feature\n\nBREAKING-CHANGE: this is a breaking change';
        expect(() =>
          ConventionalCommitMessage.parse(commitMessageString),
        ).not.toThrow();
        const commitMessage =
          ConventionalCommitMessage.parse(commitMessageString);
        expect(commitMessage.isBreakingChange).toBe(true);
      });
      test('should parse breaking change BREAKING CHANGE as type', () => {
        const commitMessageString = 'BREAKING CHANGE: add feature';
        expect(() =>
          ConventionalCommitMessage.parse(commitMessageString),
        ).not.toThrow();
        const commitMessage =
          ConventionalCommitMessage.parse(commitMessageString);
        expect(commitMessage.isBreakingChange).toBe(true);
      });
      test('should parse breaking change BREAKING-CHANGE as type', () => {
        const commitMessageString = 'BREAKING-CHANGE: add feature';
        expect(() =>
          ConventionalCommitMessage.parse(commitMessageString),
        ).not.toThrow();
        const commitMessage =
          ConventionalCommitMessage.parse(commitMessageString);
        expect(commitMessage.isBreakingChange).toBe(true);
      });
      test('should parse scope', () => {
        const commitMessageString = 'feat(scope): add feature';
        expect(() =>
          ConventionalCommitMessage.parse(commitMessageString),
        ).not.toThrow();
        const commitMessage =
          ConventionalCommitMessage.parse(commitMessageString);
        expect(commitMessage.scope).toBe('scope');
      });
      test('should parse breaking change ! with scope', () => {
        const commitMessageString = 'feat(scope)!: add feature';
        expect(() =>
          ConventionalCommitMessage.parse(commitMessageString),
        ).not.toThrow();
        const commitMessage =
          ConventionalCommitMessage.parse(commitMessageString);
        expect(commitMessage.isBreakingChange).toBe(true);
        expect(commitMessage.scope).toBe('scope');
      });
      test('should parse breaking change BREAKING CHANGE type with scope', () => {
        const commitMessageString =
          'BREAKING CHANGE(scope): BREAKING CHANGE: this is a breaking change';
        expect(() =>
          ConventionalCommitMessage.parse(commitMessageString),
        ).not.toThrow();
        const commitMessage =
          ConventionalCommitMessage.parse(commitMessageString);
        expect(commitMessage.isBreakingChange).toBe(true);
        expect(commitMessage.scope).toBe('scope');
      });
      test('should parse breaking change BREAKING-CHANGE type with scope', () => {
        const commitMessageString =
          'BREAKING-CHANGE(scope): BREAKING CHANGE: this is a breaking change';
        expect(() =>
          ConventionalCommitMessage.parse(commitMessageString),
        ).not.toThrow();
        const commitMessage =
          ConventionalCommitMessage.parse(commitMessageString);
        expect(commitMessage.isBreakingChange).toBe(true);
        expect(commitMessage.scope).toBe('scope');
      });
      test('should parse header', () => {
        const commitMessageString = 'feat: add feature';
        expect(() =>
          ConventionalCommitMessage.parse(commitMessageString),
        ).not.toThrow();
        const commitMessage =
          ConventionalCommitMessage.parse(commitMessageString);
        expect(commitMessage.header).toBe('add feature');
      });
    });
  });
});
