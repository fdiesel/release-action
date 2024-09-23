export class PreRelease {
  private _name: 'alpha' | 'beta' | 'rc';
  private _version: number;

  constructor(name: typeof this._name, version: number = 1) {
    this._name = name;
    this._version = version;
  }

  bump(name: typeof this._name): void {
    if (this._name !== name) {
      this._name = name;
      this._version = 1;
    } else {
      this._version++;
    }
  }

  toString(): string {
    return `${this._name}.${this._version}`;
  }
}

export class Version {
  private _prefix: string;
  private _major: number;
  private _minor: number;
  private _patch: number;
  private _preRelease: PreRelease | null;

  constructor(
    prefix: string,
    major: number,
    minor: number,
    patch: number,
    preRelease?: PreRelease
  ) {
    this._prefix = prefix;
    this._major = major;
    this._minor = minor;
    this._patch = patch;
    this._preRelease = preRelease || null;
  }

  bump(target: 'major' | 'minor' | 'patch' | 'alpha' | 'beta' | 'rc'): void {
    switch (target) {
      case 'major':
        this._major++;
        this._minor = 0;
        this._patch = 0;
        this._preRelease = null;
        break;
      case 'minor':
        this._minor++;
        this._patch = 0;
        this._preRelease = null;
        break;
      case 'patch':
        this._patch++;
        this._preRelease = null;
        break;
      case 'alpha':
      case 'beta':
      case 'rc':
        if (!this._preRelease) this._preRelease = new PreRelease(target);
        else this._preRelease.bump(target);
        break;
      default:
        throw new Error(`Invalid target: ${target}`);
    }
  }

  get isInitial(): boolean {
    return this._major === 0 && this._minor === 0 && this._patch === 0;
  }

  toString(): string {
    return (
      `${this._prefix}${this._major}.${this._minor}.${this._patch}` +
      (this._preRelease ? `-${this._preRelease.toString()}` : '')
    );
  }

  public static init(prefix: string): Version {
    return new Version(prefix, 0, 0, 0);
  }

  public static regExp(prefix: string): RegExp {
    return new RegExp(
      String.raw`${prefix}(\d+)\.(\d+)\.(\d+)(?:-([alpha|beta|rc]+)\.(\d+))?`
    );
  }

  public static fromTag(prefix: string, tag: string): Version {
    const match = tag.match(Version.regExp(prefix));
    if (!match)
      throw new Error(
        `Invalid tag format: ${tag}. Expected: [major].[minor].[patch]-[alpha|beta|rc].[PreReleaseVersion]`
      );
    const [_, major, minor, patch, type, version] = match;
    let preRelease: PreRelease | undefined;
    if (type && version) {
      preRelease = new PreRelease(type as any, parseInt(version));
    }
    return new Version(
      prefix,
      parseInt(major),
      parseInt(minor),
      parseInt(patch),
      preRelease
    );
  }
}
