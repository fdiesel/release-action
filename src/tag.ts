import { getInput } from '@actions/core';
import { SemVer } from './version';

export class Tag {
  public readonly prefix: string;
  public readonly version: SemVer;

  constructor(name: string) {
    this.prefix = getInput('prefix');
    if (name.startsWith(this.prefix)) {
      this.version = SemVer.fromString(name.substring(this.prefix.length));
    } else {
      this.version = SemVer.fromString(name);
    }
  }

  public toMajorString(): string {
    return `${this.prefix}${this.version.major}`;
  } 

  public toString(): string {
    return `${this.prefix}${this.version.toString()}`;
  }
}
