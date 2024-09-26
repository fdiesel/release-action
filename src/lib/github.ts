import * as core from '@actions/core';
import * as github from '@actions/github';
import { Commit } from './commit';
import { createReleaseBody } from './release';
import { Tag } from './tag';

const token = core.getInput('token');

const repo = github.context.repo;
const octokit = github.getOctokit(token);
const baseUri = `${github.context.serverUrl}/${repo.owner}/${repo.repo}`;

export async function getLatestChronologicalRelease() {
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

export async function getLatestCommits(
  since?: string | null
): Promise<Commit[]> {
  const { data } = await octokit.rest.repos.listCommits({
    ...repo,
    sha: github.context.sha,
    since: since ?? undefined
  });
  return data.map(
    (commit) => new Commit(commit.sha, commit.html_url, commit.commit.message)
  );
}

export async function getLatestCommitSha(): Promise<string> {
  const { data } = await octokit.rest.repos.listCommits({
    ...repo,
    per_page: 1
  });
  return data[0].sha;
}

export async function draftRelease(
  prevTag: Tag | undefined,
  nextTag: Tag,
  commits: Commit[]
): Promise<void> {
  const { data } = await octokit.rest.repos.createRelease({
    ...repo,
    tag_name: nextTag.toString(),
    name: nextTag.toString(),
    body: createReleaseBody(baseUri, prevTag, nextTag, commits),
    prerelease: !!nextTag.version.preRelease,
    draft: true
  });
  core.info(`Release drafted: ${data.html_url}`);
  core.saveState('releaseId', data.id);
  core.saveState('nextVersion', nextTag.version.toString());
}

export async function updateMajorTag(
  tag: Tag,
  latestCommitSha: string
): Promise<void> {
  const majorTagName = tag.toMajorString();
  let majorTag;
  try {
    const { data } = await octokit.rest.git.getRef({
      ...repo,
      ref: `tags/${majorTagName}`
    });
    majorTag = data;
  } catch (error: any) {
    if (error.status !== 404) {
      throw error;
    }
    majorTag = undefined;
  }
  if (majorTag) {
    await octokit.rest.git.updateRef({
      ...repo,
      ref: `tags/${majorTagName}`,
      sha: latestCommitSha
    });
  } else {
    await octokit.rest.git.createRef({
      ...repo,
      ref: `refs/tags/${majorTagName}`,
      sha: latestCommitSha
    });
  }
  core.info(`Major tag sha updated: ${majorTagName}`);
}

export async function createTag(tag: Tag, commitSha: string) {
  await octokit.rest.git.createRef({
    ...repo,
    ref: `tags/${tag.toString()}`,
    sha: commitSha
  });
  core.info(`Tag created: ${tag.toString()}`);
}

export async function updateTag(tag: Tag, commitSha: string) {
  await octokit.rest.git.updateRef({
    ...repo,
    ref: `tags/${tag.toString()}`,
    sha: commitSha
  });
  core.info(`Tag sha updated: ${tag.toString()}`);
}

export async function deleteTag(tag: Tag) {
  await octokit.rest.git.deleteRef({
    ...repo,
    ref: `tags/${tag.toString()}`
  });
  core.info(`Tag deleted: ${tag.toString()}`);
}

export async function finalizeRelease(
  releaseId: string,
  latestCommitSha: string
) {
  await octokit.rest.repos.updateRelease({
    ...repo,
    release_id: parseInt(releaseId),
    target_commitish: latestCommitSha,
    draft: false
  });
  core.info(`Release sha updated: ${releaseId}`);
}

export async function deleteRelease(releaseId: string) {
  await octokit.rest.repos.deleteRelease({
    ...repo,
    release_id: parseInt(releaseId)
  });
  core.info(`Release deleted: ${releaseId}`);
}
