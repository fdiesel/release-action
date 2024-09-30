import { Commit } from './lib/commit';
import { FullyQualifiedRef, RefTypes } from './lib/ref';
import { Tag } from './lib/tag';

export interface Actions<SourceCommitType> {
  getPrevTag(): Promise<Tag | undefined>;
  getCommits(sinceTag?: Tag): Promise<Commit<SourceCommitType>[]>;
  getTagCommitSha(tag: Tag): Promise<string>;
  getLatestCommitSha(): Promise<string>;
  tags: RefActions<'tags'>;
  branches: RefActions<'heads'>;
  releases: ReleaseActions<SourceCommitType>;
}

export interface RefActions<Type extends RefTypes> {
  create(ref: FullyQualifiedRef<Type>, sha: string): Promise<void>;
  update(ref: FullyQualifiedRef<Type>, sha: string): Promise<void>;
  save(ref: FullyQualifiedRef<Type>, sha: string): Promise<void>;
  delete(ref: FullyQualifiedRef<Type>): Promise<void>;
}

export interface ReleaseActions<SourceCommitType> {
  draft(
    prevTag: Tag | undefined,
    nextTag: Tag,
    commits: Commit<SourceCommitType>[]
  ): Promise<string>;
  publish(id: string, sha: string): Promise<void>;
  delete(id: string): Promise<void>;
}
