export enum RefTypes {
  HEADS = 'heads',
  TAGS = 'tags',
  PULL = 'pull',
  NOTES = 'notes',
  REMOTES = 'remotes'
}

export type ShortenedRef<Type extends RefTypes> = `${Type}/${string}`;
export type FullyQualifiedRef<Type extends RefTypes> =
  `refs/${ShortenedRef<Type>}`;

export class Ref<Type extends RefTypes> {
  public readonly type: RefTypes;
  public readonly name: string;
  public readonly shortened: ShortenedRef<Type>;
  public readonly fullyQualified: FullyQualifiedRef<Type>;

  constructor(type: Type, name: string) {
    this.type = type;
    this.name = name;
    this.shortened = `${type}/${name}`;
    this.fullyQualified = `refs/${this.shortened}`;
  }

  public toString(): string {
    return this.fullyQualified;
  }
}
