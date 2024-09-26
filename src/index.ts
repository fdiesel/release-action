import * as core from '@actions/core';
import { ConventionalCommitType } from './lib/commit';
import {
  createTag,
  draftRelease,
  getLatestChronologicalRelease,
  getLatestCommits,
  getLatestCommitSha
} from './lib/github';
import { runStrategies } from './lib/strategy';
import { Tag } from './lib/tag';
import { displayVersion } from './lib/utils';
import {
  BumpTarget,
  parseBumpTarget,
  parseSemVerPreReleaseName,
  SemVer
} from './lib/version';

async function run() {
  displayVersion();
  const prevRelease = await getLatestChronologicalRelease();
  const prevTag = prevRelease ? new Tag(prevRelease.tag_name) : undefined;
  const commits = await getLatestCommits(prevRelease?.published_at);

  let nextVersion: SemVer;
  const preReleaseNamePreset = core.getInput('pre-release')
    ? parseSemVerPreReleaseName(core.getInput('pre-release'))
    : undefined;

  if (prevTag) {
    nextVersion = prevTag.version;

    const latestPreReleaseName = commits.find(
      (commit) => !!commit.preReleaseName
    )?.preReleaseName;
    const preReleaseBumpTarget = latestPreReleaseName
      ? parseBumpTarget(latestPreReleaseName)
      : undefined;

    let mainBumpTarget: BumpTarget | undefined;

    for (const commit of commits) {
      if (!commit.conventionalCommitMessage) continue;
      const { type, isBreakingChange } = commit.conventionalCommitMessage;
      if (isBreakingChange) {
        mainBumpTarget = BumpTarget.Major;
        break;
      }
      if (
        type === ConventionalCommitType.FEAT &&
        (!mainBumpTarget || mainBumpTarget === BumpTarget.Patch)
      ) {
        mainBumpTarget = BumpTarget.Minor;
      } else if (type === ConventionalCommitType.FIX && !mainBumpTarget) {
        mainBumpTarget = BumpTarget.Patch;
      }
    }

    if (
      mainBumpTarget === BumpTarget.Major ||
      mainBumpTarget === BumpTarget.Minor ||
      (mainBumpTarget === BumpTarget.Patch && !preReleaseBumpTarget)
    ) {
      nextVersion = SemVer.bump(nextVersion, mainBumpTarget);
    }

    if (preReleaseBumpTarget) {
      nextVersion = SemVer.bump(nextVersion, preReleaseBumpTarget);
    } else if (preReleaseNamePreset) {
      nextVersion = SemVer.bump(nextVersion, preReleaseNamePreset);
    }
  } else {
    nextVersion = SemVer.first();
    if (preReleaseNamePreset) {
      nextVersion = SemVer.bump(nextVersion, preReleaseNamePreset);
    }
  }

  const nextTag = new Tag(nextVersion.toString());

  runStrategies(nextTag);

  core.setOutput('tag', nextTag.toString());
  core.setOutput('majorTag', nextTag.toMajorString());
  core.setOutput('version', nextTag.version.toString());
  core.setOutput('major', nextTag.version.major.toString());

  if (prevTag?.toString() !== nextTag.toString()) {
    await createTag(nextTag, await getLatestCommitSha());
    await draftRelease(prevTag, nextTag, commits);
    core.setOutput('created', true);
    core.setOutput('pre-release', nextTag.version.preRelease?.toString());
  } else {
    core.setOutput('created', false);
    core.setOutput('pre-release', undefined);
  }
}

run();
