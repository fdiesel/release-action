import * as core from '@actions/core';
import { Actions } from './actions';
import { GitHub } from './github';
import { inputs } from './inputs';
import { Tag } from './lib/tag';
import { displayVersion } from './lib/utils';

const status = core.getInput('_job_status') as 'success' | 'failure';

const releaseId = core.getState('releaseId');
const prevVersion = core.getState('prevVersion');
const nextVersion = core.getState('nextVersion');

async function run() {
  displayVersion();
  if (!releaseId || !nextVersion) return;
  const nextTag = Tag.parseTag(nextVersion);
  const prevTag = prevVersion ? Tag.parseVersion(prevVersion) : undefined;

  const actions: Actions<any> = new GitHub(inputs.token);

  if (status === 'success') {
    // get latest commit sha of branch
    const latestCommitSha = await actions.getLatestCommitSha();
    // update tag and publish release with latest commit sha of branch
    await actions.tags.update(nextTag.ref, latestCommitSha);
    await actions.releases.publish(releaseId, latestCommitSha);
    // create or update major tag if not pre-release
    if (!nextTag.version.preRelease) {
      await actions.tags.save(nextTag.majorRef, latestCommitSha);
    }
  } else {
    // rollback release and tag
    await actions.releases.delete(releaseId);
    await actions.tags.delete(nextTag.ref);
    // rollback release branch if major version was bumped
    if (prevTag && prevTag.version.major < nextTag.version.major) {
      await actions.branches.delete(`refs/heads/${prevTag.version.major}.x`);
    }
  }
}

run();
