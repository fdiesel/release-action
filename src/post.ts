import * as core from '@actions/core';
import {
  deleteRelease,
  deleteTag,
  finalizeRelease,
  getLatestCommitSha,
  updateTag,
  updateMajorTag as upsertMajorTag
} from './lib/github';
import { Tag } from './lib/tag';
import { displayVersion } from './lib/utils';

const status = core.getInput('_job_status') as 'success' | 'failure';

const releaseId = core.getState('releaseId');
const nextVersion = core.getState('nextVersion');

async function run() {
  displayVersion();
  if (!releaseId || !nextVersion) return;
  const nextTag = new Tag(nextVersion);

  if (status === 'success') {
    const latestCommitSha = await getLatestCommitSha();
    await updateTag(nextTag, latestCommitSha);
    await finalizeRelease(releaseId, latestCommitSha);
    if (!nextTag.version.preRelease) {
      await upsertMajorTag(nextTag, latestCommitSha);
    }
  } else {
    await deleteRelease(releaseId);
    await deleteTag(nextTag);
  }
}

run();
