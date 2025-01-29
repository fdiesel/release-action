import semver, { SemVer } from "semver";
import { Ref, RefTypes } from "./ref";

export class Tag {
  public static readonly PREFIX: string = "v";
  public readonly version: SemVer;
  public readonly ref: Ref<RefTypes.TAGS>;
  public readonly majorRef: Ref<RefTypes.TAGS>;

  constructor(version: SemVer) {
    this.version = version;
    this.ref = new Ref(RefTypes.TAGS, this.toString());
    this.majorRef = new Ref(RefTypes.TAGS, this.toMajorString());
  }

  public static parseTag(tag: string): Tag {
    const versionString = tag.substring(Tag.PREFIX.length);
    return Tag.parseVersion(versionString);
  }

  public static parseVersion(versionString: string): Tag {
    const version = semver.parse(versionString);
    if (!version) throw new Error(`Invalid version: ${versionString}`);
    return new Tag(version);
  }

  public toMajorString(): string {
    return `${Tag.PREFIX}${this.version.major}`;
  }

  public toString(): string {
    return `${Tag.PREFIX}${this.version.toString()}`;
  }
}
