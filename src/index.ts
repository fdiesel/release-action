import * as core from '@actions/core';
import { inputs } from './inputs';
import { Provider } from './lib/providers';
import { Ref, RefTypes } from './lib/ref';
import { ReleaseDevBody, ReleaseProdBody } from './lib/release';
import { Tag } from './lib/tag';
import { determineNextVersion } from './lib/utils';
import { GitHubProvider } from './providers/github';

async function run() {
  const provider: Provider<unknown, unknown> = new GitHubProvider(
    core.getInput('token', { required: true })
  );

  // get latest tag from branch
  const prevTag = await provider.getPrevTag();

  // get commits from branch
  const newCommits = await provider.getCommits(prevTag);

  // determine next version
  const nextVersion = determineNextVersion(
    prevTag?.version,
    newCommits,
    inputs.phase
  );
  const nextTag = nextVersion && new Tag(nextVersion);

  if (nextTag) {
    const majorIsBumped =
      prevTag?.version && prevTag?.version.major < nextTag.version.major;

    // create release branch if major version is bumped
    if (majorIsBumped) {
      const prevTagCommitSha = await provider.getTagCommitSha(prevTag);
      await provider.branches.create(
        new Ref(RefTypes.HEADS, `${prevTag.version.major}.x`),
        prevTagCommitSha
      );
    }

    // create tag and draft release
    await provider.tags.create(nextTag.ref, newCommits[0].sha);
    const releaseBody = majorIsBumped
      ? new ReleaseProdBody(
          provider.baseUri,
          prevTag,
          nextTag,
          await provider.getCommits()
        )
      : new ReleaseDevBody(provider.baseUri, prevTag, nextTag, newCommits);
    const releaseId = await provider.releases.draft(
      nextTag,
      releaseBody.toString()
    );

    core.saveState('releaseId', releaseId);
    core.saveState('prevVersion', prevTag?.version.toString());
    core.saveState('nextVersion', nextTag.version.toString());
    core.debug(`releaseId: '${releaseId}'`);
    core.debug(`previousVersion: '${prevTag?.version.toString()}'`);
    core.debug(`nextVersion: '${nextTag.version.toString()}'`);

    core.setOutput('tag', nextTag.toString());
    core.setOutput('majorTag', nextTag.toMajorString());
    core.setOutput('version', nextTag.version.toString());
    core.setOutput('majorVersion', nextTag.version.major.toString());
    core.setOutput('created', true);
    core.setOutput('pre-release', nextTag.version.preRelease?.toString());
  } else {
    core.setOutput('created', false);
    core.setOutput('pre-release', undefined);
  }
}

run();
