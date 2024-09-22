import { enumParserFactory } from './parser';

export enum Strategy {
  NODE = 'node'
}

export const parseStrategy = enumParserFactory(
  Strategy,
  (type) => type.toLowerCase(),
  (value) => value.toLowerCase()
);
