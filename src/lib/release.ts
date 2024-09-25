import {
  Commit,
  ConventionalCommitMessage,
  ConventionalCommitType
} from './commit';
import { Tag } from './tag';

function createHeader(
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

function createTypeSection(
  title: string,
  commits: Commit[],
  filter: (commit: ConventionalCommitMessage) => boolean
): string | null {
  const filteredCommits = commits.filter(
    (commit) =>
      commit.conventionalCommitMessage &&
      filter(commit.conventionalCommitMessage)
  );
  if (!filteredCommits.length) return null;
  return `### ${title}\n${filteredCommits
    .map(
      (commit) =>
        `- ${
          commit.conventionalCommitMessage?.scope
            ? commit.conventionalCommitMessage.scope + ': '
            : ''
        }${commit.conventionalCommitMessage!.header} ([${commit.ref}](${
          commit.url
        }))`
    )
    .join('\n')}`;
}

export function createReleaseBody(
  baseUri: string,
  prevTag: Tag | undefined,
  nextTag: Tag,
  commits: Commit[]
): string {
  return [
    createHeader(baseUri, prevTag, nextTag),
    ...[
      createTypeSection(
        '⚠ BREAKING CHANGES',
        commits,
        (commit) => commit.isBreakingChange
      ),
      createTypeSection(
        'Features',
        commits,
        (commit) => commit.type === ConventionalCommitType.FEAT
      ),
      createTypeSection(
        'Bug Fixes',
        commits,
        (commit) => commit.type === ConventionalCommitType.FIX
      )
    ].filter((section) => section !== null)
  ].join('\n');
}
