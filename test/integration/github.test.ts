import { describe, expect, test } from '@jest/globals';
import { randomUUID } from 'crypto';
import { afterEach, before } from 'node:test';
import { inputs } from '../../src/inputs';
import { Provider } from '../../src/lib/providers';
import { Ref, RefTypes } from '../../src/lib/ref';
import { GitHubProvider } from '../../src/providers/github';

const provider: Provider<unknown> = new GitHubProvider(inputs.token);
let sha: string = '';

const refStore: Ref<RefTypes>[] = [];

function generateRef<Type extends RefTypes>(type: Type): Ref<Type> {
  const ref = new Ref(type, `test-${randomUUID()}`);
  refStore.push(ref);
  return ref;
}

describe('github', () => {
  before(async () => {
    sha = await provider.getLatestCommitSha();
  });

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

  test('should check a tag', async () => {
    const ref = generateRef(RefTypes.TAGS);
    await provider.tags.create(ref, sha);
    expect(await provider.tags.exists(ref)).toBe(true);
  });

  test('should creating a tag', async () => {
    const ref = generateRef(RefTypes.TAGS);
    expect(async () => {
      provider.tags.create(ref, sha);
    }).not.toThrow();
  });

  test('should update a tag', async () => {
    const ref = generateRef(RefTypes.TAGS);
    await provider.tags.create(ref, sha);
    expect(async () => {
      provider.tags.update(ref, sha);
    }).not.toThrow();
  });
});
