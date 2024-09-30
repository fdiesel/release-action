import {
  Commit,
  ConventionalCommitMessage,
  ConventionalCommitType
} from './commit';
import { Tag } from './tag';

export class ReleaseBody {
  private readonly content: string;

  constructor(
    baseUri: string,
    prevTag: Tag | undefined,
    nextTag: Tag,
    commits: Commit<any>[]
  ) {
    this.content = [
      ReleaseBody.createHeader(baseUri, prevTag, nextTag),
      ...[
        ReleaseBody.createTypeSection(
          '⚠ BREAKING CHANGES',
          commits,
          (commit) => commit.isBreakingChange
        ),
        ReleaseBody.createTypeSection(
          'Features',
          commits,
          (commit) => commit.type === ConventionalCommitType.FEAT
        ),
        ReleaseBody.createTypeSection(
          'Bug Fixes',
          commits,
          (commit) => commit.type === ConventionalCommitType.FIX
        )
      ].filter((section) => section !== null)
    ].join('\n');
  }

  private static createHeader(
    baseUri: string,
    prevTag: Tag | undefined,
    nextTag: Tag
  ): string {
    const compareUri = prevTag
      ? `${baseUri}/compare/${prevTag.toString()}...${nextTag.toString()}`
      : undefined;
    return `# ${
      compareUri ? `[${nextTag.toString()}](${compareUri})` : nextTag.toString()
    } (${new Date().toISOString().split('T')[0]})`;
  }

  private static createTypeSection(
    title: string,
    commits: Commit<any>[],
    filter: (commit: ConventionalCommitMessage) => boolean
  ): string | null {
    const filteredCommits = commits.filter(
      (commit) => commit.message && filter(commit.message)
    );
    if (!filteredCommits.length) return null;
    return `### ${title}\n${filteredCommits
      .map(
        (commit) =>
          `- ${commit.message?.scope ? commit.message.scope + ': ' : ''}${
            commit.message!.header
          } ([${commit.id}](${commit.uri}))`
      )
      .join('\n')}`;
  }

  public toString(): string {
    return this.content;
  }
}
