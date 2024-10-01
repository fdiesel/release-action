import { Commit } from './commit';
import { Ref, RefTypes } from './ref';
import { Tag } from './tag';

export interface Provider<ProviderCommitType, ProviderRefType> {
  baseUri: string;
  getPrevTag(): Promise<Tag | undefined>;
  getCommits(sinceTag?: Tag): Promise<Commit<ProviderCommitType>[]>;
  getTagCommitSha(tag: Tag): Promise<string>;
  getLatestCommitSha(): Promise<string>;
  tags: ProviderRefs<RefTypes.TAGS, ProviderRefType>;
  branches: ProviderRefs<RefTypes.HEADS, ProviderRefType>;
  releases: ProviderReleases;
}

export interface ProviderRefs<Type extends RefTypes, ProviderRefType> {
  get(ref: Ref<Type>): Promise<ProviderRefType | undefined>;
  create(ref: Ref<Type>, sha: string): Promise<void>;
  update(ref: Ref<Type>, sha: string): Promise<void>;
  delete(ref: Ref<Type>): Promise<void>;
}

export interface ProviderReleases {
  draft(nextTag: Tag, body: string): Promise<string>;
  publish(id: string, sha: string): Promise<void>;
  delete(id: string): Promise<void>;
}

export abstract class ProviderSource<T> {
  public readonly source: T;
  constructor(source: T) {
    this.source = source;
  }
}
