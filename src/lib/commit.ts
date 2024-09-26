import {
  enumParserFactory,
  matchWithRegexFactory,
  testWithRegexFactory
} from './parser';
import { parseSemVerPreReleaseName, SemVerPreReleaseName } from './version';

export enum ConventionalCommitType {
  BREAKING_CHANGE = 'BREAKING CHANGE',
  FEAT = 'feat',
  FIX = 'fix'
}

export const parseConventionalCommitType = enumParserFactory(
  ConventionalCommitType,
  (type) => type.toLowerCase(),
  (value) => value.toLowerCase().replace('-', ' ')
);

export class ConventionalCommitMessage {
  public readonly message: string;
  public readonly header: string;
  public readonly type: ConventionalCommitType;
  public readonly scope?: string;
  public readonly isBreakingChange: boolean;

  private constructor({
    message,
    type,
    isBreakingChange,
    header,
    scope
  }: {
    message: string;
    type: ConventionalCommitType;
    isBreakingChange: boolean;
    header: string;
    scope?: string;
  }) {
    this.message = message;
    this.header = header;
    this.type = type;
    this.isBreakingChange = isBreakingChange;
    this.scope = scope;
  }

  private static decomposeMessage = matchWithRegexFactory(
    RegExp(
      String.raw`^(${[
        ...Object.values(ConventionalCommitType),
        ...Object.values(ConventionalCommitType)
          .filter((type) => type.includes(' '))
          .map((type) => type.replace(' ', '-'))
      ].join('|')})(?:\((.+)\))?(?:(\!))?\: (.+)`,
      'i'
    ),
    'type',
    'scope',
    'exclamation',
    'header'
  );

  private static includesBreakingChange = testWithRegexFactory(
    /BREAKING( |-)CHANGES?:/i
  );

  public static fromString(message: string): ConventionalCommitMessage {
    const { type, scope, exclamation, header } = this.decomposeMessage(message);
    const isBreakingChange =
      exclamation === '!' || this.includesBreakingChange(message);
    if (!type || !header) {
      throw new Error(`Invalid conventional commit message: ${message}`);
    }
    return new ConventionalCommitMessage({
      message,
      type: parseConventionalCommitType(type),
      isBreakingChange: isBreakingChange,
      header,
      scope
    });
  }

  public toString(): string {
    return this.message;
  }
}

export class Commit {
  public readonly conventionalCommitMessage?: ConventionalCommitMessage;
  public readonly plainMessage: string;
  public readonly ref: string;
  public readonly url: string;
  public readonly preReleaseName?: SemVerPreReleaseName;

  constructor(ref: string, url: string, message: string) {
    this.ref = ref.substring(0, 7);
    this.url = url;
    this.plainMessage = message;
    const { preReleaseName } = Commit.findPreReleaseName(message);
    this.preReleaseName = preReleaseName
      ? parseSemVerPreReleaseName(preReleaseName)
      : undefined;
    try {
      this.conventionalCommitMessage =
        ConventionalCommitMessage.fromString(message);
    } catch (_: any) {
      this.conventionalCommitMessage = undefined;
    }
  }

  private static findPreReleaseName = matchWithRegexFactory(
    /\((alpha|beta|rc)\)/i,
    'preReleaseName'
  );
}
