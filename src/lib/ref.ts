export type RefTypes = 'heads' | 'tags' | 'pull' | 'notes' | 'remotes';
export type ShortenedRef<Type extends RefTypes> = `${Type}/${string}`;
export type FullyQualifiedRef<Type extends RefTypes> =
  `refs/${ShortenedRef<Type>}`;
