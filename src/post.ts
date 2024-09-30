import * as core from '@actions/core';
import { inputs } from './inputs';
import { Provider } from './lib/providers';
import { Ref, RefTypes } from './lib/ref';
import { Tag } from './lib/tag';
import { displayVersion } from './lib/utils';
import { GitHubProvider } from './providers/github';

const status = core.getInput('_job_status') as 'success' | 'failure';

const releaseId = core.getState('releaseId');
const prevVersion = core.getState('prevVersion');
const nextVersion = core.getState('nextVersion');

async function run() {
  displayVersion();
  if (!releaseId || !nextVersion) return;
  const nextTag = Tag.parseVersion(nextVersion);
  const prevTag = prevVersion ? Tag.parseVersion(prevVersion) : undefined;

  const provider: Provider<unknown> = new GitHubProvider(inputs.token);

  if (status === 'success') {
    // get latest commit sha of branch
    const latestCommitSha = await provider.getLatestCommitSha();
    // update tag and publish release with latest commit sha of branch
    await provider.tags.update(nextTag.ref, latestCommitSha);
    await provider.releases.publish(releaseId, latestCommitSha);
    // create or update major tag if not pre-release
    if (!nextTag.version.preRelease) {
      if (await provider.tags.exists(nextTag.majorRef)) {
        await provider.tags.update(nextTag.majorRef, latestCommitSha);
      } else {
        await provider.tags.create(nextTag.majorRef, latestCommitSha);
      }
    }
  } else {
    // rollback release and tag
    await provider.releases.delete(releaseId);
    await provider.tags.delete(nextTag.ref);
    // rollback release branch if major version was bumped
    if (prevTag && prevTag.version.major < nextTag.version.major) {
      await provider.branches.delete(
        new Ref(RefTypes.HEADS, `${nextTag.version.major}.x`)
      );
    }
  }
}

run();
