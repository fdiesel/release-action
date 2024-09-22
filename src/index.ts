import * as core from '@actions/core';
import * as github from '@actions/github';
import { Commit, ConventionalCommitType } from './commit';
import { createReleaseBody } from './release';
import { Tag } from './tag';
import { BumpTarget, parseBumpTarget, SemVer } from './version';

// inputs
const token = core.getInput('token');

// context
const repo = github.context.repo;
const octokit = github.getOctokit(token);
const baseUri = `${github.context.serverUrl}/${repo.owner}/${repo.repo}`;

async function getLatestRelease() {
  try {
    const { data: releases } = await octokit.rest.repos.listReleases({
      ...repo
    });
    const chronologicalReleases = releases.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return chronologicalReleases.length > 0 ? chronologicalReleases[0] : null;
  } catch (error: any) {
    if (error.status === 404) return null;
    core.setFailed(error.message);
  }
}

async function getLatestCommits(since?: string | null): Promise<Commit[]> {
  const { data } = await octokit.rest.repos.listCommits({
    ...repo,
    sha: github.context.sha,
    since: since ?? undefined
  });
  return data.map(
    (commit) => new Commit(commit.sha, commit.html_url, commit.commit.message)
  );
}

async function createDraftRelease(
  prevTag: Tag | undefined,
  nextTag: Tag,
  commits: Commit[]
): Promise<void> {
  const { data } = await octokit.rest.repos.createRelease({
    ...repo,
    tag_name: nextTag.toString(),
    name: nextTag.toString(),
    body: createReleaseBody(baseUri, prevTag, nextTag, commits),
    draft: true,
    prerelease: !!nextTag.version.preRelease
  });
  core.info(`Release draft created: ${data.html_url}`);
  core.saveState('releaseId', data.id);
  core.saveState('nextVersion', nextTag.version.toString());
}

async function run() {
  const prevRelease = await getLatestRelease();
  const prevTag = prevRelease ? new Tag(prevRelease.tag_name) : undefined;
  const commits = await getLatestCommits(prevRelease?.published_at);

  let nextVersion: SemVer;

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
    }
  } else {
    nextVersion = SemVer.first();
  }

  const nextTag = new Tag(nextVersion.toString());

  core.setOutput('tag', nextTag.toString());
  core.setOutput('version', nextTag.version.toString());

  if (prevTag?.toString() !== nextTag.toString()) {
    createDraftRelease(prevTag, nextTag, commits);
    core.setOutput('created', true);
    core.setOutput('pre-release', nextTag.version.preRelease?.toString());
  } else {
    core.setOutput('created', false);
    core.setOutput('pre-release', undefined);
  }
}

run();
