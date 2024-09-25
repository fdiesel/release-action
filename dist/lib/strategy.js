"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseStrategy = exports.Strategy = void 0;
exports.runStrategies = runStrategies;
const core_1 = require("@actions/core");
const github = __importStar(require("@actions/github"));
const child_process_1 = require("child_process");
const parser_1 = require("./parser");
var Strategy;
(function (Strategy) {
    Strategy["NODE"] = "node";
})(Strategy || (exports.Strategy = Strategy = {}));
exports.parseStrategy = (0, parser_1.enumParserFactory)(Strategy, (type) => type.toLowerCase(), (value) => value.toLowerCase());
const strategy = (0, core_1.getInput)('strategy')
    ? (0, exports.parseStrategy)((0, core_1.getInput)('strategy'))
    : undefined;
function runStrategies(nextTag) {
    return __awaiter(this, void 0, void 0, function* () {
        switch (strategy) {
            case Strategy.NODE:
                (0, child_process_1.execSync)(`git config user.name "GitHub Actions"`);
                (0, child_process_1.execSync)(`git config user.email "action@github.com"`);
                (0, child_process_1.execSync)(`npm version ${nextTag.version.toString()} -m "chore(node): bump version to %s" --allow-same-version`);
                (0, child_process_1.execSync)(`git push origin HEAD:${github.context.ref}`);
                break;
        }
    });
}
