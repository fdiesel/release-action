export function enumParserFactory<T extends object>(
  type: T,
  mapTypeValue: (type: string) => string,
  mapValue: (value: string) => string,
): (value: string) => T[keyof T] {
  return (value: string) => {
    value = mapValue(value);
    const enumValue = Object.values(type).find(
      (t: string) => mapTypeValue(t) === value,
    );
    if (!enumValue) {
      throw new Error(
        `Invalid value: ${value}, expected: ${Object.values(type)}`,
      );
    }
    return enumValue;
  };
}

export function matchWithRegexFactory<T extends string>(
  regex: RegExp,
  ...keys: T[]
): (text: string) => Record<T, string | undefined> {
  return (text: string) => {
    const match = text.match(regex) ?? undefined;
    return keys.reduce(
      (acc, key, index) => {
        acc[key] = match?.[index + 1] || undefined;
        return acc;
      },
      {} as Record<T, string | undefined>,
    );
  };
}

export function testWithRegexFactory(regex: RegExp): (text: string) => boolean {
  return (text: string) => regex.test(text);
}
