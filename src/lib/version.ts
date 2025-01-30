import { enumParserFactory, matchWithRegexFactory } from './parser';
import { Phase } from './phase';

export enum SemVerPreReleaseName {
  Alpha = 'alpha',
  Beta = 'beta',
  Rc = 'rc',
}

export const parseSemVerPreReleaseName = enumParserFactory(
  SemVerPreReleaseName,
  (type) => type.toLowerCase(),
  (value) => value.toLowerCase(),
);

export enum BumpTarget {
  Major = 'major',
  Minor = 'minor',
  Patch = 'patch',
  Alpha = 'alpha',
  Beta = 'beta',
  Rc = 'rc',
}

export const parseBumpTarget = enumParserFactory(
  BumpTarget,
  (type) => type.toLowerCase(),
  (value) => value.toLowerCase(),
);

export class SemVerPreRelease {
  public readonly name: SemVerPreReleaseName;
  public readonly version: number;

  constructor(name: SemVerPreReleaseName, version: number = 0) {
    this.name = name;
    this.version = version;
  }

  public toString(): string {
    return `${this.name}${this.version > 0 ? `.${this.version}` : ''}`;
  }

  public static bump(
    preRelease: SemVerPreRelease,
    name: SemVerPreReleaseName,
  ): SemVerPreRelease {
    if (preRelease.name !== name) {
      return new SemVerPreRelease(name);
    } else {
      return new SemVerPreRelease(name, preRelease.version + 1);
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
    preRelease?: SemVerPreRelease,
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

  public static init(phase: Phase): SemVer {
    switch (phase) {
      case Phase.Prod:
        return new SemVer(1, 0, 0);
      case Phase.Dev:
        return new SemVer(0, 1, 0);
    }
  }

  private static matchSemVer = matchWithRegexFactory(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([alpha|beta|rc]+)(?:\.(0|[1-9]\d*))?)?$/,
    'major',
    'minor',
    'patch',
    'preReleaseName',
    'preReleaseVersion',
  );

  public static parse(version: string): SemVer {
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
            preReleaseVersion ? parseInt(preReleaseVersion) : undefined,
          )
        : undefined,
    );
  }

  public static bump(
    version: SemVer,
    target: BumpTarget | SemVerPreReleaseName,
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
            new SemVerPreRelease(preReleaseName),
          );
        else
          return new SemVer(
            version.major,
            version.minor,
            version.patch,
            SemVerPreRelease.bump(version.preRelease, preReleaseName),
          );
    }
  }
}
