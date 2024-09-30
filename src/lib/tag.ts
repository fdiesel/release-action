import { SemVer } from './version';

export class Tag {
  public static readonly PREFIX: string = 'v';
  public readonly version: SemVer;
  public readonly ref: RefString<'tags'>;
  public readonly majorRef: RefString<'tags'>;

  constructor(version: SemVer) {
    this.version = version;
    this.ref = `refs/tags/${this.toString()}`;
    this.majorRef = `refs/tags/${this.toMajorString()}`;
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
