import * as core from '@actions/core';
import * as github from '@actions/github';
import { Version } from './version';

// inputs
const token = core.getInput('GITHUB_TOKEN');
const prefix = core.getInput('prefix');
const target = core.getInput('target') as 'alpha' | 'beta' | 'rc' | undefined;

// context
const repo = github.context.repo;
const octokit = github.getOctokit(token);

async function getLatestRelease() {
  try {
    const { data } = await octokit.rest.repos.getLatestRelease(repo);
    return data;
  } catch (error: any) {
    if (error.status === 404) return null;
    core.setFailed(error.message);
  }
}

async function getLatestCommits(since?: string | null) {
  const { data } = await octokit.rest.repos.listCommits({
    ...repo,
    sha: github.context.sha,
    since: since ?? undefined
  });
  return data;
}

async function createRelease(
  version: Version,
  commits: Awaited<ReturnType<typeof getLatestCommits>>
) {
  const { data } = await octokit.rest.repos.createRelease({
    ...repo,
    tag_name: version.toString(),
    name: version.toString(),
    body: commits.map((commit) => `- ${commit.commit.message}`).join('\n')
  });
  return data;
}

async function determineMainVersionBumpTarget(
  version: Version,
  commits: Awaited<ReturnType<typeof getLatestCommits>>
) {
  if (version.isInitial) return 'minor';
  const messages = commits.map((commit) => commit.commit.message);
  const regex = /^\w+\!\:/;
  if (
    messages.some(
      (message) => regex.test(message) || message.includes('BREAKING CHANGE')
    )
  )
    return 'major';
  if (messages.some((message) => message.startsWith('feat'))) return 'minor';
  return 'patch';
}

function determinePreReleaseBumpTarget(): 'alpha' | 'beta' | 'rc' | null {
  const prTitle: string | undefined =
    github.context.payload.pull_request?.title ?? '(beta)';
  if (prTitle?.includes('(rc)')) return 'rc';
  if (prTitle?.includes('(beta)')) return 'beta';
  if (prTitle?.includes('(alpha)')) return 'alpha';
  return null;
}

async function run() {
  const prevRelease = await getLatestRelease();
  const version = prevRelease
    ? Version.fromTag(prefix, prevRelease.tag_name)
    : Version.init(prefix);
  const commits = await getLatestCommits(prevRelease?.published_at);

  const mainBumpTarget = await determineMainVersionBumpTarget(version, commits);
  const preReleaseBumpTarget = determinePreReleaseBumpTarget();
  if (
    (mainBumpTarget !== 'patch' && preReleaseBumpTarget) ||
    !preReleaseBumpTarget
  ) {
    version.bump(mainBumpTarget);
  }
  if (preReleaseBumpTarget) {
    version.bump(preReleaseBumpTarget);
  }

  createRelease(version, commits);

  core.setOutput('previous tag', prevRelease?.tag_name);
  core.setOutput('new tag', version.toString());
}

run();
