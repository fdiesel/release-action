import { getInput, setFailed } from "@actions/core";
import { Phase } from "./lib/phase";

function getValidatedInput<T>({
  name,
  required,
  validateFn,
  parseFn,
}: {
  name: string;
  required: boolean;
  validateFn: (input: string) => boolean;
  parseFn: (input: string) => T;
}): T {
  const input = getInput(name, { required });
  if (!validateFn(input)) {
    const errorMessage = `Invalid input: '${name}' = '${input}'`;
    setFailed(errorMessage);
    throw new Error(errorMessage);
  }
  return parseFn(input);
}

export const inputs = {
  token: getValidatedInput<string>({
    name: "token",
    required: true,
    validateFn: (input) => input.length > 0,
    parseFn: (input) => input,
  }),
  phase: getValidatedInput<Phase>({
    name: "phase",
    required: true,
    validateFn: (input) =>
      Object.values(Phase).includes(input.toLocaleLowerCase() as Phase),
    parseFn: (input) =>
      Object.values(Phase).find(
        (phase) => phase === input.toLocaleLowerCase()
      )!,
  }),
};
