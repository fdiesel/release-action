import { context, getOctokit } from '@actions/github';
import { afterAll, describe, expect, test } from '@jest/globals';
import { randomUUID } from 'crypto';
import { inputs } from '../../src/inputs';
import { Provider } from '../../src/lib/providers';
import { Ref, RefTypes } from '../../src/lib/ref';
import { GitHubProvider } from '../../src/providers/github';

const provider: Provider<unknown, unknown> = new GitHubProvider(inputs.token);

async function generateParams<Type extends RefTypes>(
  type: Type
): Promise<{ ref: Ref<Type>; sha: string }> {
  const ref = new Ref(type, `test-${randomUUID()}`);
  const sha = await provider.getLatestCommitSha();
  return { ref, sha };
}

describe('github', () => {
  afterAll(async () => {
    const repo = context.repo;
    const octokit = getOctokit(inputs.token);
    const regex =
      /test-[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;

    const refs: Awaited<
      ReturnType<(typeof octokit)['rest']['git']['getRef']>
    >['data'][] = [];
    for (const type of Object.values(RefTypes)) {
      const { data } = await octokit.rest.git.listMatchingRefs({
        ...repo,
        ref: `${type}/`
      });
      refs.push(...data);
    }

    for (const ref of refs) {
      if (regex.test(ref.ref)) {
        const shortenedRef = ref.ref.replace(/^refs\//, '');
        await octokit.rest.git.deleteRef({
          ...repo,
          ref: shortenedRef
        });
      }
    }
  });

  test('should get latest commit sha', async () => {
    const latestCommitSha = await provider.getLatestCommitSha();
    expect(latestCommitSha).toBeTruthy();
  });

  // test('should check a tag', async () => {
  //   const { ref, sha } = await generateParams(RefTypes.TAGS);
  //   await provider.tags.create(ref, sha);
  //   await expect(provider.tags.get(ref)).resolves.toBeDefined();
  // });

  test('should create a tag', async () => {
    const { ref, sha } = await generateParams(RefTypes.TAGS);
    expect(async () => {
      provider.tags.create(ref, sha);
    }).not.toThrow();
  });

  test('should get an existing tag', async () => {
    const { ref, sha } = await generateParams(RefTypes.TAGS);
    await provider.tags.create(ref, sha);
    await expect(provider.tags.get(ref)).resolves.toBeDefined();
  });

  test('should not get a non-existing tag', async () => {
    const ref = new Ref(RefTypes.TAGS, `test-${randomUUID()}`);
    await expect(provider.tags.get(ref)).resolves.toBeUndefined();
  });

  // test('should update a tag', async () => {
  //   const { ref, sha } = await generateParams(RefTypes.TAGS);
  //   await provider.tags.create(ref, sha);
  //   expect(async () => {
  //     provider.tags.update(ref, sha);
  //   }).not.toThrow();
  // });

  // test('should delete a tag', async () => {
  //   const { ref, sha } = await generateParams(RefTypes.TAGS);
  //   await provider.tags.create(ref, sha);
  //   expect(async () => {
  //     provider.tags.delete(ref);
  //   }).not.toThrow();
  // });

  // test('should check a branch', async () => {
  //   const { ref, sha } = await generateParams(RefTypes.HEADS);
  //   await provider.branches.create(ref, sha);
  //   await expect(provider.branches.get(ref)).resolves.toBeDefined();
  // });

  test('should creating a branch', async () => {
    const { ref, sha } = await generateParams(RefTypes.HEADS);
    expect(async () => {
      provider.branches.create(ref, sha);
    }).not.toThrow();
  });

  test('should create a branch for a previous commit', async () => {
    const { ref } = await generateParams(RefTypes.HEADS);
    const commits = await provider.getCommits();
    if (commits.length < 2) return;
    const firstCommit = commits[commits.length - 1];
    expect(async () => {
      provider.branches.create(ref, firstCommit.sha);
    }).not.toThrow();
  });

  // test('should create a branch for a previous commit with octo', async () => {
  //   const { ref } = await generateParams(RefTypes.HEADS);
  //   const commits = await provider.getCommits();
  //   const initialSha = commits[commits.length - 1].sha;
  //   const repo = context.repo;
  //   const octokit = getOctokit(inputs.token);
  //   await expect(
  //     octokit.rest.git.createRef({
  //       ...repo,
  //       ref: ref.fullyQualified,
  //       sha: initialSha
  //     })
  //   ).rejects.toThrow();
  // });

  // test('should update a branch', async () => {
  //   const { ref, sha } = await generateParams(RefTypes.HEADS);
  //   await provider.branches.create(ref, sha);
  //   expect(async () => {
  //     provider.branches.update(ref, sha);
  //   }).not.toThrow();
  // });

  // test('should delete a branch', async () => {
  //   const { ref, sha } = await generateParams(RefTypes.HEADS);
  //   await provider.branches.create(ref, sha);
  //   expect(async () => {
  //     provider.branches.delete(ref);
  //   }).not.toThrow();
  // });
});
