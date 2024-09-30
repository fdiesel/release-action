type RefStringTypes = 'heads' | 'tags' | 'pull' | 'notes' | 'remotes';
type RefString<Type extends RefStringTypes> = `refs/${Type}/${string}`;
