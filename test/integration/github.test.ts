import { describe, expect, test } from '@jest/globals';
import { inputs } from '../../src/inputs';
import { Provider } from '../../src/lib/providers';
import { Ref, RefTypes } from '../../src/lib/ref';
import { GitHubProvider } from '../../src/providers/github';

describe('github', () => {
  const provider: Provider<unknown> = new GitHubProvider(inputs.token);
  const ref = new Ref(RefTypes.TAGS, 'test');
  test('should check a tag', async () => {
    const sha = await provider.getLatestCommitSha();
    await provider.tags.create(ref, sha);
    expect(await provider.tags.exists(ref)).toBe(true);
  });
  test('should creating a tag', async () => {
    const sha = await provider.getLatestCommitSha();
    expect(async () => {
      provider.tags.create(ref, sha);
    }).not.toThrow();
    await provider.tags.delete(ref);
  });
  test('should create a branch', async () => {
    const sha = await provider.getLatestCommitSha();
    const branch = new Ref(RefTypes.HEADS, 'test');
    expect(async () => {
      provider.branches.create(branch, sha);
    }).not.toThrow();
    await provider.branches.delete(branch);
  });
});
