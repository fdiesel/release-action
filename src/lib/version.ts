import { getInput } from '@actions/core';
import { enumParserFactory, matchWithRegexFactory } from './parser';

export enum SemVerPreReleaseName {
  Alpha = 'alpha',
  Beta = 'beta',
  Rc = 'rc'
}

export const parseSemVerPreReleaseName = enumParserFactory(
  SemVerPreReleaseName,
  (type) => type.toLowerCase(),
  (value) => value.toLowerCase()
);

export enum BumpTarget {
  Major = 'major',
  Minor = 'minor',
  Patch = 'patch',
  Alpha = 'alpha',
  Beta = 'beta',
  Rc = 'rc'
}

export const parseBumpTarget = enumParserFactory(
  BumpTarget,
  (type) => type.toLowerCase(),
  (value) => value.toLowerCase()
);

export class SemVerPreRelease {
  private readonly _name: SemVerPreReleaseName;
  private readonly _version: number;

  constructor(name: SemVerPreReleaseName, version: number = 0) {
    this._name = name;
    this._version = version;
  }

  public toString(): string {
    return `${this._name}${this._version > 0 ? `.${this._version}` : ''}`;
  }

  public static bump(
    preRelease: SemVerPreRelease,
    name: SemVerPreReleaseName
  ): SemVerPreRelease {
    if (preRelease._name !== name) {
      return new SemVerPreRelease(name);
    } else {
      return new SemVerPreRelease(name, preRelease._version + 1);
    }
  }
}

export class SemVer {
  public readonly major: number;
  public readonly minor: number;
  public readonly patch: number;
  public readonly preRelease: SemVerPreRelease | null;

  constructor(
    major: number,
    minor: number,
    patch: number,
    preRelease?: SemVerPreRelease
  ) {
    this.major = major;
    this.minor = minor;
    this.patch = patch;
    this.preRelease = preRelease || null;
  }

  toString(): string {
    return (
      `${this.major}.${this.minor}.${this.patch}` +
      (this.preRelease ? `-${this.preRelease.toString()}` : '')
    );
  }

  public static first(): SemVer {
    return SemVer.fromString(getInput('first'));
  }

  private static matchSemVer = matchWithRegexFactory(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([alpha|beta|rc]+)(?:\.(\d+))?)?$/,
    'major',
    'minor',
    'patch',
    'preReleaseName',
    'preReleaseVersion'
  );

  public static fromString(version: string): SemVer {
    const { major, minor, patch, preReleaseName, preReleaseVersion } =
      this.matchSemVer(version);
    if (!major || !minor || !patch) {
      throw new Error(`Invalid semver: '${version}'`);
    }
    return new SemVer(
      parseInt(major),
      parseInt(minor),
      parseInt(patch),
      preReleaseName
        ? new SemVerPreRelease(
            parseSemVerPreReleaseName(preReleaseName),
            preReleaseVersion ? parseInt(preReleaseVersion) : undefined
          )
        : undefined
    );
  }

  public static bump(
    version: SemVer,
    target: BumpTarget | SemVerPreReleaseName
  ): SemVer {
    switch (target) {
      case BumpTarget.Major:
        return new SemVer(version.major + 1, 0, 0);
      case BumpTarget.Minor:
        return new SemVer(version.major, version.minor + 1, 0);
      case BumpTarget.Patch:
        return new SemVer(version.major, version.minor, version.patch + 1);
      case BumpTarget.Alpha:
      case BumpTarget.Beta:
      case BumpTarget.Rc:
      case SemVerPreReleaseName.Alpha:
      case SemVerPreReleaseName.Beta:
      case SemVerPreReleaseName.Rc:
        const preReleaseName = parseSemVerPreReleaseName(target);
        if (!version.preRelease)
          return new SemVer(
            version.major,
            version.minor,
            version.patch,
            new SemVerPreRelease(preReleaseName)
          );
        else
          return new SemVer(
            version.major,
            version.minor,
            version.patch,
            SemVerPreRelease.bump(version.preRelease, preReleaseName)
          );
      default:
        throw new Error(`Invalid target: ${target}`);
    }
  }
}
