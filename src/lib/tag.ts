import { Ref } from './ref';
import { SemVer } from './version';

export class Tag {
  public static readonly PREFIX: string = 'v';
  public readonly version: SemVer;
  public readonly ref: Ref<'tags'>;
  public readonly majorRef: Ref<'tags'>;

  constructor(version: SemVer) {
    this.version = version;
    this.ref = new Ref('tags', this.toString());
    this.majorRef = new Ref('tags', this.toMajorString());
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
