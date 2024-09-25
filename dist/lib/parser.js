"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enumParserFactory = enumParserFactory;
exports.matchWithRegexFactory = matchWithRegexFactory;
exports.testWithRegexFactory = testWithRegexFactory;
function enumParserFactory(type, mapTypeValue, mapValue) {
    return (value) => {
        value = mapValue(value);
        const enumValue = Object.values(type).find((t) => mapTypeValue(t) === value);
        if (!enumValue) {
            throw new Error(`Invalid value: ${value}, expected: ${Object.values(type)}`);
        }
        return enumValue;
    };
}
function matchWithRegexFactory(regex, ...keys) {
    return (text) => {
        var _a;
        const match = (_a = text.match(regex)) !== null && _a !== void 0 ? _a : undefined;
        return keys.reduce((acc, key, index) => {
            acc[key] = (match === null || match === void 0 ? void 0 : match[index + 1]) || undefined;
            return acc;
        }, {});
    };
}
function testWithRegexFactory(regex) {
    return (text) => regex.test(text);
}
