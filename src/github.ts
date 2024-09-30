import * as core from '@actions/core';
import * as github from '@actions/github';
import { Actions, RefActions, ReleaseActions } from './actions';
import { Commit } from './lib/commit';
import { ReleaseBody } from './lib/release';
import { Tag } from './lib/tag';

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
  protected readonly octokit: ReturnType<typeof github.getOctokit>;
  protected readonly baseUri: string;
  protected readonly branchName: string;
  protected readonly branchRef: RefString<'heads'>;

  constructor(octokit: Octokit) {
    this.repo = github.context.repo;
    this.octokit = octokit;
    this.baseUri = `${github.context.serverUrl}/${this.repo.owner}/${this.repo.repo}`;

    // get branch name of the workflow
    const branchRefPrefix: RefString<'heads'> = 'refs/heads/';
    this.branchName = github.context.ref.split(branchRefPrefix).pop()!;
    this.branchRef = `refs/heads/${this.branchName}`;

    // // Check if the event is a pull request
    // if (github.context.payload.pull_request) {
    //   // For pull request events, use the source branch (head branch)
    //   this.branch = github.context.payload.pull_request.head.ref;
    // } else {
    //   // For other events (like push), use the ref and remove 'refs/heads/' prefix
    //   const ref = github.context.ref;

    //   if (ref.startsWith('refs/heads/')) {
    //     this.branch = ref.replace('refs/heads/', ''); // Return the branch name for push events
    //   } else if (ref.startsWith('refs/tags/')) {
    //     this.branch = ref.replace('refs/tags/', ''); // Handle tags if needed
    //   }

    //   throw new Error('Could not determine the branch name from the context.');
    // }
  }
}

export class GitHub
  extends GitHubAction
  implements Actions<GitHubSourceCommit>
{
  tags: RefActions<'tags'>;
  branches: RefActions<'heads'>;
  releases: ReleaseActions<GitHubSourceCommit>;

  constructor(token: string) {
    const octokit = github.getOctokit(token);
    super(octokit);
    this.tags = new GitHubRefs(this.octokit);
    this.branches = new GitHubRefs(this.octokit);
    this.releases = new GitHubReleases(this.octokit);
  }

  async getPrevTag(): Promise<Tag | undefined> {
    const { data } = await this.octokit.rest.repos.listTags({
      ...this.repo,
      per_page: 1
    });
    return data.length > 0 ? Tag.parseTag(data[0].name) : undefined;
  }

  async getCommitsAfterTag(tag: Tag): Promise<Commit<GitHubSourceCommit>[]> {
    const { data } = await this.octokit.rest.repos.compareCommits({
      ...this.repo,
      base: tag.ref,
      head: this.branchRef
    });
    return data.commits.map((commit) => new GitHubCommit(commit));
  }

  async getTagCommitSha(tag: Tag): Promise<string> {
    const { data } = await this.octokit.rest.git.getRef({
      ...this.repo,
      ref: tag.ref
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

class GitHubRefs<Type extends RefStringTypes>
  extends GitHubAction
  implements RefActions<Type>
{
  constructor(octokit: Octokit) {
    super(octokit);
  }

  async create(ref: RefString<Type>, sha: string): Promise<void> {
    await this.octokit.rest.git.createRef({ ...this.repo, ref, sha });
    core.info(`Ref created: ${ref}`);
  }

  async update(ref: RefString<Type>, sha: string): Promise<void> {
    await this.octokit.rest.git.updateRef({ ...this.repo, ref, sha });
    core.info(`Ref updated: ${ref}`);
  }

  async save(ref: RefString<Type>, sha: string): Promise<void> {
    let refAlreadyExists = false;
    try {
      await this.octokit.rest.git.getRef({ ...this.repo, ref });
      refAlreadyExists = true;
    } catch (error: any) {
      if (error.status !== 404) {
        core.setFailed(error.message);
        throw error;
      }
    }
    if (refAlreadyExists) {
      await this.update(ref, sha);
    } else {
      await this.create(ref, sha);
    }
  }

  async delete(ref: RefString<Type>): Promise<void> {
    await this.octokit.rest.git.deleteRef({ ...this.repo, ref });
    core.info(`Ref deleted: ${ref}`);
  }
}

class GitHubReleases
  extends GitHubAction
  implements ReleaseActions<GitHubSourceCommit>
{
  constructor(octokit: Octokit) {
    super(octokit);
  }

  async getByTag(tag: Tag) {
    const { data } = await this.octokit.rest.repos.getReleaseByTag({
      ...this.repo,
      tag: tag.toString()
    });
    return data;
  }

  async draft(
    prevTag: Tag | undefined,
    nextTag: Tag,
    commits: Commit<GitHubSourceCommit>[]
  ): Promise<string> {
    const { data } = await this.octokit.rest.repos.createRelease({
      ...this.repo,
      tag_name: nextTag.toString(),
      name: nextTag.toString(),
      body: new ReleaseBody(this.baseUri, prevTag, nextTag, commits).toString(),
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
