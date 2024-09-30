import { describe, expect, test } from '@jest/globals';
import { inputs } from '../../src/inputs';
import { Provider } from '../../src/lib/providers';
import { Ref, RefTypes } from '../../src/lib/ref';
import { GitHubProvider } from '../../src/providers/github';

describe('github', () => {
  const provider: Provider<unknown> = new GitHubProvider(inputs.token);
  test('should not fail creating a tag', () => {
    expect(async () => {
      const ref = new Ref(RefTypes.TAGS, 'test');
      const sha = await provider.getLatestCommitSha();
      provider.tags.create(ref, sha);
    }).not.toThrow();
  });
});
