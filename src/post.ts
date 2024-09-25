import * as core from '@actions/core';
import * as github from '@actions/github';
import { execSync } from 'child_process';
import { parseStrategy, Strategy } from './strategy';

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
  switch (strategy) {
    case Strategy.NODE:
      execSync(`git config user.name "GitHub Actions"`);
      execSync(`git config user.email "action@github.com"`);
      execSync(
        `npm version ${nextVersion} -m "chore(node): bump version to %s" --allow-same-version`
      );
      execSync(`git push -f origin HEAD:${github.context.ref}`);
      break;
  }
  const { data } = await octokit.rest.repos.updateRelease({
    ...repo,
    release_id: parseInt(releaseId),
    draft: false,
    target_commitish: await getLatestCommitSha()
  });
  core.info(`Release created: ${data.html_url}`);
}

run();
