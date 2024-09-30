import { FullyQualifiedRef, ShortenedRef } from './ref';
import { SemVer } from './version';

export class Tag {
  public static readonly PREFIX: string = 'v';
  public readonly version: SemVer;
  public readonly shortRef: ShortenedRef<'tags'>;
  public readonly shortMajorRef: ShortenedRef<'tags'>;
  public readonly fqRef: FullyQualifiedRef<'tags'>;
  public readonly fqMajorRef: FullyQualifiedRef<'tags'>;

  constructor(version: SemVer) {
    this.version = version;
    this.shortRef = `tags/${this.toString()}`;
    this.shortMajorRef = `tags/${this.toMajorString()}`;
    this.fqRef = `refs/${this.shortRef}`;
    this.fqMajorRef = `refs/${this.shortMajorRef}`;
  }

  public static parseTag(tag: string): Tag {
    const version = SemVer.parse(tag.substring(Tag.PREFIX.length));
    return new Tag(version);
  }

  public static parseVersion(version: string): Tag {
    return new Tag(SemVer.parse(version));
  }

  public toMajorString(): string {
    return `${Tag.PREFIX}${this.version.major}`;
  }

  public toString(): string {
    return `${Tag.PREFIX}${this.version.toString()}`;
  }
}
