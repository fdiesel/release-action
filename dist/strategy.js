"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseStrategy = exports.Strategy = void 0;
const parser_1 = require("./parser");
var Strategy;
(function (Strategy) {
    Strategy["NODE"] = "node";
})(Strategy || (exports.Strategy = Strategy = {}));
exports.parseStrategy = (0, parser_1.enumParserFactory)(Strategy, (type) => type.toLowerCase(), (value) => value.toLowerCase());
