import { SemVer } from "semver";
import { Commit, ConventionalCommitType } from "./commit";
import { Phase } from "./phase";

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
      preReleaseName: undefined,
    } as {
      hasBreakingChanges: boolean;
      type: ConventionalCommitType | undefined;
      preReleaseName: string | undefined;
    }
  );

  if (!prevVersion || (prevVersion.major === 0 && phase === Phase.Prod)) {
    switch (phase) {
      case Phase.Prod:
        if (preReleaseName) {
          return new SemVer("1.0.0-" + preReleaseName + ".0");
        } else {
          return new SemVer("1.0.0");
        }
      case Phase.Dev:
        if (preReleaseName) {
          return new SemVer("0.1.0-" + preReleaseName + ".0");
        } else {
          return new SemVer("0.1.0");
        }
    }
  }

  if (hasBreakingChanges && phase === Phase.Prod) {
    nextVersion = prevVersion.inc("major");
  } else if (hasBreakingChanges && phase === Phase.Dev) {
    nextVersion = prevVersion.inc("minor");
  } else if (type === ConventionalCommitType.FEAT) {
    nextVersion = prevVersion.inc("minor");
  } else if (type === ConventionalCommitType.FIX && !preReleaseName) {
    nextVersion = prevVersion.inc("patch");
  }

  if (preReleaseName && nextVersion) {
    nextVersion = nextVersion.inc("prerelease", preReleaseName);
  } else if (preReleaseName && prevVersion) {
    nextVersion = prevVersion.inc("prerelease", preReleaseName);
  }

  return nextVersion;
}
