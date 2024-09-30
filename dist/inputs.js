"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inputs = void 0;
const core_1 = require("@actions/core");
const strategy_1 = require("./lib/strategy");
const version_1 = require("./lib/version");
function getValidatedInput({ name, required, validateFn, parseFn }) {
    const input = (0, core_1.getInput)(name, { required });
    if (!validateFn(input)) {
        const errorMessage = `Invalid input: '${name}' = '${input}'`;
        (0, core_1.setFailed)(errorMessage);
        throw new Error(errorMessage);
    }
    return parseFn(input);
}
exports.inputs = {
    token: getValidatedInput({
        name: 'token',
        required: true,
        validateFn: (input) => input.length > 0,
        parseFn: (input) => input
    }),
    phase: getValidatedInput({
        name: 'phase',
        required: true,
        validateFn: (input) => Object.values(version_1.Phase).includes(input.toLocaleLowerCase()),
        parseFn: (input) => Object.values(version_1.Phase).find((phase) => phase === input.toLocaleLowerCase())
    }),
    strategy: getValidatedInput({
        name: 'strategy',
        required: false,
        validateFn: (input) => {
            if (input === '')
                return true;
            return Object.values(strategy_1.Strategy).includes(input.toLowerCase());
        },
        parseFn: (input) => {
            return Object.values(strategy_1.Strategy).find((strategy) => strategy === input.toLowerCase());
        }
    })
};
