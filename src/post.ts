import * as core from '@actions/core';
import * as github from '@actions/github';
import { execSync } from 'child_process';
import { parseStrategy, Strategy } from './strategy';
import { Tag } from './tag';

const token = core.getInput('token');
const strategy = core.getInput('strategy')
  ? parseStrategy(core.getInput('strategy'))
  : undefined;
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
  if (!releaseId || !nextVersion) return;
  const nextTag = new Tag(nextVersion);

  // strategies
  switch (strategy) {
    case Strategy.NODE:
      execSync(`git config user.name "GitHub Actions"`);
      execSync(`git config user.email "action@github.com"`);
      execSync(
        `npm version ${nextTag.version.toString()} -m "chore(node): bump version to %s" --allow-same-version`
      );
      execSync(`git push origin HEAD:${github.context.ref}`);
      break;
  }

  const latestCommitSha = await getLatestCommitSha();

  // major tag
  const majorTagName = nextTag.toMajorString();
  const { data: majorTag } = await octokit.rest.git.getRef({
    ...repo,
    ref: `tags/${majorTagName}`
  });
  if (majorTag) {
    await octokit.rest.git.updateRef({
      ...repo,
      ref: `tags/${majorTagName}`,
      sha: latestCommitSha,
    });
  } else {
    await octokit.rest.git.createRef({
      ...repo,
      ref: `refs/tags/${majorTagName}`,
      sha: latestCommitSha,
    });
  }

  // release
  const { data } = await octokit.rest.repos.updateRelease({
    ...repo,
    release_id: parseInt(releaseId),
    draft: false,
    target_commitish: latestCommitSha
  });
  core.info(`Release created: ${data.html_url}`);
}

run();
