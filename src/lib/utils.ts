import { Commit, ConventionalCommitType } from './commit';
import { BumpTarget, Phase, SemVer, SemVerPreReleaseName } from './version';

export function determineNextVersion<SourceCommitType>(
  prevVersion: SemVer | undefined,
  commits: Commit<SourceCommitType>[],
  phase: Phase
): SemVer | null {
  let nextVersion: SemVer | null = null;

  const { hasBreakingChanges, type, preReleaseName } = commits.reduce(
    (acc, commit) => {
      // skip commits outside of the conventional commit scope
      if (!commit.message) return acc;

      // set preReleaseName to the latest preReleaseName in the commits
      if (commit.preReleaseName && !acc.preReleaseName) {
        acc.preReleaseName = commit.preReleaseName;
      }

      // (first prio) handle braking changes
      if (commit.message.isBreakingChange) {
        acc.hasBreakingChanges = true;
        acc.type = ConventionalCommitType.FEAT;
        return acc;
      }

      // (second prio) handle feat
      if (commit.message.type === ConventionalCommitType.FEAT) {
        acc.type = ConventionalCommitType.FEAT;
        return acc;
      }

      // (third prio) handle fix
      if (
        commit.message.type === ConventionalCommitType.FIX &&
        acc.type !== ConventionalCommitType.FEAT
      ) {
        acc.type = ConventionalCommitType.FIX;
      }

      return acc;
    },
    {
      hasBreakingChanges: false,
      type: undefined,
      preReleaseName: undefined
    } as {
      hasBreakingChanges: boolean;
      type: ConventionalCommitType | undefined;
      preReleaseName: SemVerPreReleaseName | undefined;
    }
  );

  if (!prevVersion || (prevVersion.major === 0 && phase === Phase.Prod)) {
    nextVersion = SemVer.init(phase);
    if (preReleaseName) {
      nextVersion = SemVer.bump(nextVersion, preReleaseName);
    }
    return nextVersion;
  }

  if (hasBreakingChanges && phase === Phase.Prod) {
    nextVersion = SemVer.bump(prevVersion, BumpTarget.Major);
  } else if (hasBreakingChanges && phase === Phase.Dev) {
    nextVersion = SemVer.bump(prevVersion, BumpTarget.Minor);
  } else if (type === ConventionalCommitType.FEAT) {
    nextVersion = SemVer.bump(prevVersion, BumpTarget.Minor);
  } else if (type === ConventionalCommitType.FIX && !preReleaseName) {
    nextVersion = SemVer.bump(prevVersion, BumpTarget.Patch);
  }

  if (preReleaseName) {
    nextVersion = SemVer.bump(nextVersion ?? prevVersion, preReleaseName);
  }

  return nextVersion;
}
