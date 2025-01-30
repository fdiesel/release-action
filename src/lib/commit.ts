import {
  enumParserFactory,
  matchWithRegexFactory,
  testWithRegexFactory,
} from './parser';
import { ProviderSource } from './providers';

export enum ConventionalCommitType {
  BREAKING_CHANGE = 'BREAKING CHANGE',
  FEAT = 'feat',
  FIX = 'fix',
}

export const parseConventionalCommitType = enumParserFactory(
  ConventionalCommitType,
  (type) => type.toLowerCase(),
  (value) => value.toLowerCase().replace('-', ' '),
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
    scope,
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
          .map((type) => type.replace(' ', '-')),
      ].join('|')})(?:\((.+)\))?(?:(\!))?\: (.+)`,
      'i',
    ),
    'type',
    'scope',
    'exclamation',
    'header',
  );

  private static includesBreakingChange = testWithRegexFactory(
    /BREAKING( |-)CHANGES?:/i,
  );

  public static parse(message: string): ConventionalCommitMessage {
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
      scope,
    });
  }

  public toString(): string {
    return this.message;
  }
}

export abstract class Commit<
  SourceCommitType,
> extends ProviderSource<SourceCommitType> {
  public readonly message?: ConventionalCommitMessage;
  public readonly preReleaseName?: string;
  public readonly sha: string;
  public readonly uri: string;
  public readonly id: string;

  constructor(
    source: SourceCommitType,
    plainMessage: string,
    sha: string,
    uri: string,
    id: string,
  ) {
    super(source);
    this.sha = sha;
    this.uri = uri;
    this.id = id;
    const { preReleaseName } = Commit.findPreReleaseName(plainMessage);
    this.preReleaseName = preReleaseName;
    try {
      this.message = ConventionalCommitMessage.parse(plainMessage);
    } catch (_error: unknown) {
      void _error;
      this.message = undefined;
    }
  }

  private static findPreReleaseName = matchWithRegexFactory(
    /\((alpha|beta|rc)\)/i,
    'preReleaseName',
  );
}
