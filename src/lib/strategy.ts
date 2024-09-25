import { getInput } from '@actions/core';
import * as github from '@actions/github';
import { execSync } from 'child_process';
import { enumParserFactory } from './parser';
import { Tag } from './tag';

export enum Strategy {
  NODE = 'node'
}

export const parseStrategy = enumParserFactory(
  Strategy,
  (type) => type.toLowerCase(),
  (value) => value.toLowerCase()
);

const strategy = getInput('strategy')
  ? parseStrategy(getInput('strategy'))
  : undefined;

export async function runStrategies(nextTag: Tag) {
  switch (strategy) {
    case Strategy.NODE:
      execSync(`git config user.name "GitHub Actions"`);
      execSync(`git config user.email "action@github.com"`);
      execSync(
        `npm version ${nextTag.version.toString()} -m "chore(node): bump version to %s" --allow-same-version`
      );
      execSync(`git push origin HEAD:${github.context.ref}`);
      break;
  }
}
