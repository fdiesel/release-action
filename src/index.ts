import * as core from '@actions/core';
import { Actions } from './actions';
import { GitHub } from './github';
import { inputs } from './inputs';
import { runStrategies } from './lib/strategy';
import { Tag } from './lib/tag';
import { determineNextVersion, displayVersion } from './lib/utils';

async function run() {
  displayVersion();
  const actions: Actions<any> = new GitHub(inputs.token);

  // get latest tag from branch
  const prevTag = await actions.getPrevTag();

  // get latest release from branch
  const prevRelease = prevTag && (await actions.releases.getByTag(prevTag));

  // get commits from branch
  const commits = await actions.getCommitsAfterTag(prevRelease?.published_at);

  // determine next version
  const nextVersion = determineNextVersion(
    prevTag?.version,
    commits,
    inputs.phase
  );
  const nextTag = nextVersion && new Tag(nextVersion);

  if (nextTag) {
    runStrategies(nextTag);

    // create release branch if major version is bumped
    if (prevTag?.version && prevTag?.version.major < nextTag.version.major) {
      const prevTagCommitSha = await actions.getTagCommitSha(prevTag);
      await actions.branches.create(
        `refs/heads/${prevTag.version.major}.x`,
        prevTagCommitSha
      );
    }

    // create tag and draft release
    await actions.tags.create(nextTag.ref, commits[0].sha);
    const releaseId = await actions.releases.draft(prevTag, nextTag, commits);

    core.saveState('releaseId', releaseId);
    core.saveState('prevVersion', prevTag?.version.toString());
    core.saveState('nextVersion', nextTag.version.toString());

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
