import { Commit } from './lib/commit';
import { Tag } from './lib/tag';

export interface Actions<SourceCommitType> {
  getPrevTag(): Promise<Tag | undefined>;
  getCommitsAfterTag(tag: Tag): Promise<Commit<SourceCommitType>[]>;
  getTagCommitSha(tag: Tag): Promise<string>;
  getLatestCommitSha(): Promise<string>;
  tags: RefActions<'tags'>;
  branches: RefActions<'heads'>;
  releases: ReleaseActions<SourceCommitType>;
}

export interface RefActions<Type extends RefStringTypes> {
  create(ref: RefString<Type>, sha: string): Promise<void>;
  update(ref: RefString<Type>, sha: string): Promise<void>;
  save(ref: RefString<Type>, sha: string): Promise<void>;
  delete(ref: RefString<Type>): Promise<void>;
}

export interface ReleaseActions<SourceCommitType> {
  getByTag(tag: Tag): Promise<any>;
  draft(
    prevTag: Tag | undefined,
    nextTag: Tag,
    commits: Commit<SourceCommitType>[]
  ): Promise<string>;
  publish(id: string, sha: string): Promise<void>;
  delete(id: string): Promise<void>;
}
