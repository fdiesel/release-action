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
const inputs_1 = require("./inputs");
const ref_1 = require("./lib/ref");
const release_1 = require("./lib/release");
const tag_1 = require("./lib/tag");
const utils_1 = require("./lib/utils");
const github_1 = require("./providers/github");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const provider = new github_1.GitHubProvider(core.getInput('token', { required: true }));
        // get latest tag from branch
        const prevTag = yield provider.getPrevTag();
        // get commits from branch
        const newCommits = yield provider.getCommits(prevTag);
        // determine next version
        const nextVersion = (0, utils_1.determineNextVersion)(prevTag === null || prevTag === void 0 ? void 0 : prevTag.version, newCommits, inputs_1.inputs.phase);
        const nextTag = nextVersion && new tag_1.Tag(nextVersion);
        if (nextTag) {
            const majorIsBumped = (prevTag === null || prevTag === void 0 ? void 0 : prevTag.version) && (prevTag === null || prevTag === void 0 ? void 0 : prevTag.version.major) < nextTag.version.major;
            // create release branch if major version is bumped
            if (majorIsBumped) {
                const prevTagCommitSha = yield provider.getTagCommitSha(prevTag);
                yield provider.branches.create(new ref_1.Ref(ref_1.RefTypes.HEADS, `${prevTag.version.major}.x`), prevTagCommitSha);
            }
            // create tag and draft release
            yield provider.tags.create(nextTag.ref, newCommits[0].sha);
            const releaseBody = majorIsBumped
                ? new release_1.ReleaseProdBody(provider.baseUri, prevTag, nextTag, yield provider.getCommits())
                : new release_1.ReleaseDevBody(provider.baseUri, prevTag, nextTag, newCommits);
            const releaseId = yield provider.releases.draft(nextTag, releaseBody.toString());
            core.saveState('releaseId', releaseId);
            core.saveState('prevVersion', prevTag === null || prevTag === void 0 ? void 0 : prevTag.version.toString());
            core.saveState('nextVersion', nextTag.version.toString());
            core.debug(`releaseId: '${releaseId}'`);
            core.debug(`previousVersion: '${prevTag === null || prevTag === void 0 ? void 0 : prevTag.version.toString()}'`);
            core.debug(`nextVersion: '${nextTag.version.toString()}'`);
            core.setOutput('tag', nextTag.toString());
            core.setOutput('majorTag', nextTag.toMajorString());
            core.setOutput('version', nextTag.version.toString());
            core.setOutput('majorVersion', nextTag.version.major.toString());
            core.setOutput('created', true);
            core.setOutput('pre-release', nextTag.version.prerelease.length > 0
                ? nextTag.version.prerelease[0]
                : 'undefined');
        }
        else {
            core.setOutput('created', false);
            core.setOutput('pre-release', undefined);
        }
    });
}
run();
