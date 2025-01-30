import * as core from '@actions/core';
import { inputs } from './inputs';
import { releaseToDiscord } from './lib/discord';
import { Provider } from './lib/providers';
import { Ref, RefTypes } from './lib/ref';
import { Tag } from './lib/tag';
import { GitHubProvider } from './providers/github';

const status = core.getInput('_job_status') as 'success' | 'failure';

const releaseId = core.getState('releaseId');
const prevVersion = core.getState('prevVersion');
const nextVersion = core.getState('nextVersion');
const releaseNotes = core.getState('releaseNotes');

async function run() {
  const prevTag = prevVersion ? Tag.parseVersion(prevVersion) : undefined;
  const nextTag = nextVersion ? Tag.parseVersion(nextVersion) : undefined;
  const provider: Provider<unknown, unknown> = new GitHubProvider(inputs.token);

  if (status === 'success') {
    const latestCommitSha = await provider.getLatestCommitSha();
    if (releaseId && nextTag) {
      await provider.tags.update(nextTag.ref, latestCommitSha);
      await provider.releases.publish(releaseId, latestCommitSha);
      await releaseToDiscord(
        nextTag.toString(),
        nextTag.version.toString(),
        releaseNotes,
      );
    }
    const tag = nextTag || prevTag;
    if (tag && tag.version.prerelease.length === 0) {
      const remoteTag = await provider.tags.get(tag.majorRef);
      if (remoteTag) {
        await provider.tags.update(tag.majorRef, latestCommitSha);
      } else {
        await provider.tags.create(tag.majorRef, latestCommitSha);
      }
    }
  } else {
    if (nextTag) {
      await provider.releases.delete(releaseId);
      await provider.tags.delete(nextTag.ref);
      if (prevTag && prevTag.version.major < nextTag.version.major) {
        await provider.branches.delete(
          new Ref(RefTypes.HEADS, `${nextTag.version.major}.x`),
        );
      }
    }
  }
}

run();
