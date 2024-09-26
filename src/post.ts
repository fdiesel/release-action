import * as core from '@actions/core';
import * as github from '@actions/github';
import {
  deleteRelease,
  deleteTag,
  updateRelease,
  updateTag,
  updateMajorTag as upsertMajorTag
} from './lib/github';
import { Tag } from './lib/tag';

const token = core.getInput('token');

const releaseId = core.getState('releaseId');
const nextVersion = core.getState('nextVersion');

const repo = github.context.repo;
const octokit = github.getOctokit(token);

async function getLatestCommitSha(): Promise<string> {
  const { data } = await octokit.rest.repos.listCommits({
    ...repo,
    per_page: 1
  });
  return data[0].sha;
}

async function run() {
  core.info(`GITHUB_JOB: ${process.env['GITHUB_JOB']}`);
  core.info(`GITHUB_STATE: ${process.env['GITHUB_STATE']}`);
  core.info(process.exitCode?.toString() ?? '');

  if (!releaseId || !nextVersion) return;
  const nextTag = new Tag(nextVersion);

  if (process.exitCode === 0) {
    const latestCommitSha = await getLatestCommitSha();
    await updateTag(nextTag, latestCommitSha);
    await updateRelease(releaseId, latestCommitSha);
    await upsertMajorTag(nextTag, latestCommitSha);
  } else {
    await deleteRelease(releaseId);
    await deleteTag(nextTag);
  }
}

run();
