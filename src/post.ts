import * as core from '@actions/core';
import * as github from '@actions/github';
import {
    deleteRelease,
    deleteTag,
    finalizeRelease,
    updateTag,
    updateMajorTag as upsertMajorTag
} from './lib/github';
import { Tag } from './lib/tag';
import { displayVersion } from './lib/utils';

const token = core.getInput('token');
const status = core.getInput('_job_status') as 'success' | 'failure';

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
  displayVersion();
  if (!releaseId || !nextVersion) return;
  const nextTag = new Tag(nextVersion);

  if (status === 'success') {
    const latestCommitSha = await getLatestCommitSha();
    await updateTag(nextTag, latestCommitSha);
    await finalizeRelease(releaseId, latestCommitSha);
    await upsertMajorTag(nextTag, latestCommitSha);
  } else {
    await deleteRelease(releaseId);
    await deleteTag(nextTag);
  }
}

run();
