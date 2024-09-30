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
const core = __importStar(require("@actions/core"));
const github_1 = require("./github");
const inputs_1 = require("./inputs");
const tag_1 = require("./lib/tag");
const utils_1 = require("./lib/utils");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        (0, utils_1.displayVersion)();
        const actions = new github_1.GitHub(inputs_1.inputs.token);
        // get latest tag from branch
        const prevTag = yield actions.getPrevTag();
        // get commits from branch
        const commits = yield actions.getCommits(prevTag);
        // determine next version
        const nextVersion = (0, utils_1.determineNextVersion)(prevTag === null || prevTag === void 0 ? void 0 : prevTag.version, commits, inputs_1.inputs.phase);
        const nextTag = nextVersion && new tag_1.Tag(nextVersion);
        if (nextTag) {
            // create release branch if major version is bumped
            if ((prevTag === null || prevTag === void 0 ? void 0 : prevTag.version) && (prevTag === null || prevTag === void 0 ? void 0 : prevTag.version.major) < nextTag.version.major) {
                const prevTagCommitSha = yield actions.getTagCommitSha(prevTag);
                yield actions.branches.create(`refs/heads/${prevTag.version.major}.x`, prevTagCommitSha);
            }
            // create tag and draft release
            yield actions.tags.create(nextTag.fqRef, commits[0].sha);
            const releaseId = yield actions.releases.draft(prevTag, nextTag, commits);
            core.saveState('releaseId', releaseId);
            core.saveState('prevVersion', prevTag === null || prevTag === void 0 ? void 0 : prevTag.version.toString());
            core.saveState('nextVersion', nextTag.version.toString());
            core.setOutput('tag', nextTag.toString());
            core.setOutput('majorTag', nextTag.toMajorString());
            core.setOutput('version', nextTag.version.toString());
            core.setOutput('majorVersion', nextTag.version.major.toString());
            core.setOutput('created', true);
            core.setOutput('pre-release', (_a = nextTag.version.preRelease) === null || _a === void 0 ? void 0 : _a.toString());
        }
        else {
            core.setOutput('created', false);
            core.setOutput('pre-release', undefined);
        }
    });
}
run();
