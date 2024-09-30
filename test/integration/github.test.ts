import { describe, expect, test } from '@jest/globals';
import { inputs } from '../../src/inputs';
import { Provider } from '../../src/lib/providers';
import { Ref, RefTypes } from '../../src/lib/ref';
import { GitHubProvider } from '../../src/providers/github';

describe('github', async () => {
  const provider: Provider<unknown> = new GitHubProvider(inputs.token);
  const ref = new Ref(RefTypes.TAGS, 'test');
  const sha = await provider.getLatestCommitSha();
  test('should check a tag', async () => {
    await provider.tags.create(ref, sha);
    expect(await provider.tags.exists(ref)).toBe(true);
  });
  test('should creating a tag', async () => {
    expect(async () => {
      provider.tags.create(ref, sha);
    }).not.toThrow();
    await provider.tags.delete(ref);
  });
});
