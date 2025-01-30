import * as core from '@actions/core';
import * as github from '@actions/github';
import { Commit } from '../lib/commit';
import { Provider, ProviderRefs, ProviderReleases } from '../lib/providers';
import { FullyQualifiedRef, Ref, RefTypes } from '../lib/ref';
import { Tag } from '../lib/tag';

type Octokit = ReturnType<typeof github.getOctokit>;
type GitHubCommitType = Awaited<
  ReturnType<Octokit['rest']['repos']['getCommit']>
>['data'];
type GitHubRefType = Awaited<
  ReturnType<Octokit['rest']['git']['getRef']>
>['data'];
type GitHubPermissionsType = Awaited<
  ReturnType<Octokit['rest']['apps']['getRepoInstallation']>
>['data']['permissions'];

class GitHubCommit extends Commit<GitHubCommitType> {
  constructor(commit: GitHubCommitType) {
    super(
      commit,
      commit.commit.message,
      commit.sha,
      commit.html_url,
      commit.sha.substring(0, 7),
    );
  }
}

abstract class GitHubAction {
  protected readonly repo: typeof github.context.repo;
  protected readonly octokit: Octokit;
  protected readonly branchRef: Ref<RefTypes.HEADS>;

  constructor(octokit: Octokit) {
    this.repo = github.context.repo;
    this.octokit = octokit;

    const branchRefPrefix: FullyQualifiedRef<RefTypes.HEADS> = 'refs/heads/';
    const branchName = github.context.ref.split(branchRefPrefix).pop()!;
    this.branchRef = new Ref(RefTypes.HEADS, branchName);
  }
}

export class GitHubProvider
  extends GitHubAction
  implements Provider<GitHubCommitType, GitHubRefType>
{
  tags: ProviderRefs<RefTypes.TAGS, GitHubRefType>;
  branches: ProviderRefs<RefTypes.HEADS, GitHubRefType>;
  releases: ProviderReleases;
  baseUri: string;

  constructor(token: string) {
    const octokit = github.getOctokit(token);
    super(octokit);
    this.tags = new GitHubRefs(this.octokit);
    this.branches = new GitHubRefs(this.octokit);
    this.releases = new GitHubReleases(this.octokit);
    this.baseUri = `${github.context.serverUrl}/${this.repo.owner}/${this.repo.repo}`;

    core.debug(
      `Initialized GitHub Provider on branch: '${this.branchRef.name}'`,
    );
  }

  async getPrevTag(): Promise<Tag | undefined> {
    core.debug('Getting previous tag');
    const { data } = await this.octokit.rest.repos.listTags({
      ...this.repo,
      per_page: 1,
    });
    core.debug(`Previous tag: '${data.length > 0 ? data[0].name : ''}'`);
    return data.length > 0 ? Tag.parseTag(data[0].name) : undefined;
  }

  /**
   * Get commits since a given tag or from the beginning of the branch
   * @param sinceTag only get commits after this tag
   * @returns commits ordered from newest to oldest
   */
  async getCommits(sinceTag?: Tag): Promise<Commit<GitHubCommitType>[]> {
    core.debug(
      `Getting commits since '${sinceTag ? sinceTag.toString() : 'beginning'}'`,
    );
    if (sinceTag) {
      const { data } = await this.octokit.rest.repos.compareCommits({
        ...this.repo,
        head: this.branchRef.name,
        base: sinceTag.ref.fullyQualified,
      });
      core.debug(`Received commits: ${data.commits.length}`);
      return data.commits.reverse().map((commit) => new GitHubCommit(commit));
    } else {
      const { data } = await this.octokit.rest.repos.listCommits({
        ...this.repo,
        head: this.branchRef.name,
        sha: this.branchRef.name,
      });
      core.debug(`Received commits: ${data.length}`);
      return data.map((commit) => new GitHubCommit(commit));
    }
  }

  async getTagCommitSha(tag: Tag): Promise<string> {
    core.debug(`Getting commit SHA for tag '${tag.toString()}'`);
    const { data } = await this.octokit.rest.git.getRef({
      ...this.repo,
      ref: tag.ref.shortened,
    });
    core.debug(`Received commit SHA: '${data.object.sha}'`);
    return data.object.sha;
  }

  async getLatestCommitSha(): Promise<string> {
    core.debug('Getting latest commit SHA');
    const { data } = await this.octokit.rest.repos.getCommit({
      ...this.repo,
      ref: this.branchRef.name,
    });
    core.debug(`Received latest commit SHA: '${data.sha}'`);
    return data.sha;
  }
}

class GitHubRefs<Type extends RefTypes>
  extends GitHubAction
  implements ProviderRefs<Type, GitHubRefType>
{
  constructor(octokit: Octokit) {
    super(octokit);
  }

  async get(ref: Ref<Type>): Promise<GitHubRefType | undefined> {
    core.debug(`Getting ref: '${ref}'`);
    try {
      const { data } = await this.octokit.rest.git.getRef({
        ...this.repo,
        ref: ref.shortened,
      });
      core.debug(`Received ref: '${data.ref}'`);
      return data;
    } catch (error: any) {
      if (error?.status === 404) {
        core.debug(`Received ref: undefined`);
        return undefined;
      } else {
        core.setFailed(error?.message);
        throw error;
      }
    }
  }

  async create(ref: Ref<Type>, sha: string): Promise<void> {
    core.debug(`Creating ref: '${ref}'`);
    await this.octokit.rest.git.createRef({
      ...this.repo,
      ref: ref.fullyQualified,
      sha,
    });
    core.info(`Ref created: ${ref}`);
  }

  async update(ref: Ref<Type>, sha: string): Promise<void> {
    core.debug(`Updating ref: '${ref}'`);
    await this.octokit.rest.git.updateRef({
      ...this.repo,
      ref: ref.shortened,
      sha,
    });
    core.info(`Ref updated: ${ref}`);
  }

  async delete(ref: Ref<Type>): Promise<void> {
    core.debug(`Deleting ref: '${ref}'`);
    await this.octokit.rest.git.deleteRef({ ...this.repo, ref: ref.shortened });
    core.info(`Ref deleted: ${ref}`);
  }
}

class GitHubReleases extends GitHubAction implements ProviderReleases {
  constructor(octokit: Octokit) {
    super(octokit);
  }

  async draft(nextTag: Tag, body: string): Promise<string> {
    core.debug(`Drafting release: '${nextTag.toString()}'`);
    const { data } = await this.octokit.rest.repos.createRelease({
      ...this.repo,
      tag_name: nextTag.toString(),
      name: nextTag.toString(),
      body,
      prerelease: nextTag.version.prerelease.length > 0,
      draft: true,
    });
    core.info(`Release drafted: ${data.id.toString()}`);
    return data.id.toString();
  }

  async publish(id: string, sha: string): Promise<void> {
    core.debug(`Publishing release: '${id}'`);
    await this.octokit.rest.repos.updateRelease({
      ...this.repo,
      release_id: parseInt(id),
      target_commitish: sha,
      draft: false,
    });
    core.info(`Release published: ${id}`);
  }

  async delete(id: string): Promise<void> {
    core.debug(`Deleting release: '${id}'`);
    await this.octokit.rest.repos.deleteRelease({
      ...this.repo,
      release_id: parseInt(id),
    });
    core.info(`Release deleted: ${id}`);
  }
}
