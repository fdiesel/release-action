import { describe, expect, test } from '@jest/globals';
import { randomUUID } from 'crypto';
import { afterEach } from 'node:test';
import { inputs } from '../../src/inputs';
import { Provider } from '../../src/lib/providers';
import { Ref, RefTypes } from '../../src/lib/ref';
import { GitHubProvider } from '../../src/providers/github';

const provider: Provider<unknown> = new GitHubProvider(inputs.token);

const refStore: Ref<RefTypes>[] = [];

async function generateParams<Type extends RefTypes>(
  type: Type
): Promise<{ ref: Ref<Type>; sha: string }> {
  const ref = new Ref(type, `test-${randomUUID()}`);
  refStore.push(ref);
  const sha = await provider.getLatestCommitSha();
  return { ref, sha };
}

describe('github', () => {
  afterEach(async () => {
    for (const ref of refStore) {
      switch (ref.type) {
        case RefTypes.HEADS:
          await provider.branches.delete(ref as Ref<RefTypes.HEADS>);
          break;
        case RefTypes.TAGS:
          await provider.tags.delete(ref as Ref<RefTypes.TAGS>);
          break;
      }
    }
  });

  test('should get latest commit sha', async () => {
    const latestCommitSha = await provider.getLatestCommitSha();
    expect(latestCommitSha).toBeTruthy();
  });

  test('should check a tag', async () => {
    const { ref, sha } = await generateParams(RefTypes.TAGS);
    await provider.tags.create(ref, sha);
    expect(await provider.tags.exists(ref)).toBe(true);
  });

  test('should creating a tag', async () => {
    const { ref, sha } = await generateParams(RefTypes.TAGS);
    expect(async () => {
      provider.tags.create(ref, sha);
    }).not.toThrow();
  });

  test('should update a tag', async () => {
    const { ref, sha } = await generateParams(RefTypes.TAGS);
    await provider.tags.create(ref, sha);
    expect(async () => {
      provider.tags.update(ref, sha);
    }).not.toThrow();
  });
});
