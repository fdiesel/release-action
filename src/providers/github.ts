import * as core from '@actions/core';
import * as github from '@actions/github';
import { Commit } from '../lib/commit';
import {
  Provider,
  ProviderRefActions,
  ProviderReleaseActions
} from '../lib/providers';
import { FullyQualifiedRef, Ref, RefTypes } from '../lib/ref';
import { Tag } from '../lib/tag';

type Octokit = ReturnType<typeof github.getOctokit>;
type GitHubSourceCommit = Awaited<
  ReturnType<Octokit['rest']['repos']['getCommit']>
>['data'];

class GitHubCommit extends Commit<GitHubSourceCommit> {
  constructor(commit: GitHubSourceCommit) {
    super(
      commit,
      commit.commit.message,
      commit.sha,
      commit.html_url,
      commit.sha.substring(0, 7)
    );
  }
}

abstract class GitHubAction {
  protected readonly repo: typeof github.context.repo;
  protected readonly octokit: Octokit;
  protected readonly branchName: string;
  protected readonly branchRef: FullyQualifiedRef<RefTypes.HEADS>;

  constructor(octokit: Octokit) {
    this.repo = github.context.repo;
    this.octokit = octokit;

    // get branch name of the workflow
    const branchRefPrefix: FullyQualifiedRef<RefTypes.HEADS> = 'refs/heads/';
    this.branchName = github.context.ref.split(branchRefPrefix).pop()!;
    this.branchRef = `${branchRefPrefix}${this.branchName}`;
  }
}

export class GitHubProvider
  extends GitHubAction
  implements Provider<GitHubSourceCommit>
{
  tags: ProviderRefActions<RefTypes.TAGS>;
  branches: ProviderRefActions<RefTypes.HEADS>;
  releases: ProviderReleaseActions;
  baseUri: string;

  constructor(token: string) {
    const octokit = github.getOctokit(token);
    super(octokit);
    this.tags = new GitHubRefs(this.octokit);
    this.branches = new GitHubRefs(this.octokit);
    this.releases = new GitHubReleases(this.octokit);
    this.baseUri = `${github.context.serverUrl}/${this.repo.owner}/${this.repo.repo}`;
  }

  async getPrevTag(): Promise<Tag | undefined> {
    const { data } = await this.octokit.rest.repos.listTags({
      ...this.repo,
      per_page: 1
    });
    return data.length > 0 ? Tag.parseTag(data[0].name) : undefined;
  }

  async getCommits(sinceTag?: Tag): Promise<Commit<GitHubSourceCommit>[]> {
    if (sinceTag) {
      const { data } = await this.octokit.rest.repos.compareCommits({
        ...this.repo,
        base: sinceTag.ref.fullyQualified,
        head: this.branchRef
      });
      return data.commits.map((commit) => new GitHubCommit(commit));
    } else {
      const { data } = await this.octokit.rest.repos.listCommits({
        ...this.repo,
        sha: this.branchName
      });
      return data.map((commit) => new GitHubCommit(commit));
    }
  }

  async getTagCommitSha(tag: Tag): Promise<string> {
    const { data } = await this.octokit.rest.git.getRef({
      ...this.repo,
      ref: `tags/${tag.toString()}`
    });
    return data.object.sha;
  }

  async getLatestCommitSha(): Promise<string> {
    const { data } = await this.octokit.rest.repos.getCommit({
      ...this.repo,
      ref: this.branchRef
    });
    return data.sha;
  }
}

class GitHubRefs<Type extends RefTypes>
  extends GitHubAction
  implements ProviderRefActions<Type>
{
  constructor(octokit: Octokit) {
    super(octokit);
  }

  async exists(ref: Ref<Type>): Promise<boolean> {
    try {
      await this.octokit.rest.git.getRef({
        ...this.repo,
        ref: ref.shortened
      });
      return true;
    } catch (error: any) {
      if (error.status !== 404) {
        core.setFailed(error.message);
        throw error;
      }
      return false;
    }
  }

  async create(ref: Ref<Type>, sha: string): Promise<void> {
    await this.octokit.rest.git.createRef({
      ...this.repo,
      ref: ref.fullyQualified,
      sha
    });
    core.info(`Ref created: ${ref}`);
  }

  async update(ref: Ref<Type>, sha: string): Promise<void> {
    await this.octokit.rest.git.updateRef({
      ...this.repo,
      ref: ref.shortened,
      sha
    });
    core.info(`Ref updated: ${ref}`);
  }

  async delete(ref: Ref<Type>): Promise<void> {
    await this.octokit.rest.git.deleteRef({ ...this.repo, ref: ref.shortened });
    core.info(`Ref deleted: ${ref}`);
  }
}

class GitHubReleases extends GitHubAction implements ProviderReleaseActions {
  constructor(octokit: Octokit) {
    super(octokit);
  }

  async draft(nextTag: Tag, body: string): Promise<string> {
    const { data } = await this.octokit.rest.repos.createRelease({
      ...this.repo,
      tag_name: nextTag.toString(),
      name: nextTag.toString(),
      body,
      prerelease: !!nextTag.version.preRelease,
      draft: true
    });
    core.info(`Release drafted: ${data.id.toString()}`);
    return data.id.toString();
  }

  async publish(id: string, sha: string): Promise<void> {
    await this.octokit.rest.repos.updateRelease({
      ...this.repo,
      release_id: parseInt(id),
      target_commitish: sha,
      draft: false
    });
    core.info(`Release published: ${id}`);
  }

  async delete(id: string): Promise<void> {
    await this.octokit.rest.repos.deleteRelease({
      ...this.repo,
      release_id: parseInt(id)
    });
    core.info(`Release deleted: ${id}`);
  }
}
