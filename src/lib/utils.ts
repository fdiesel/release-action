import { info } from '@actions/core';
import { context } from '@actions/github';

export function displayVersion() {
  info(
    `${context.repo.owner}/${context.repo.repo}@${
      require('../../package.json').version
    }`
  );
}
