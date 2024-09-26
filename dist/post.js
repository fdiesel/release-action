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
const github = __importStar(require("@actions/github"));
const github_1 = require("./lib/github");
const tag_1 = require("./lib/tag");
const token = core.getInput('token');
const releaseId = core.getState('releaseId');
const nextVersion = core.getState('nextVersion');
const repo = github.context.repo;
const octokit = github.getOctokit(token);
function getLatestCommitSha() {
    return __awaiter(this, void 0, void 0, function* () {
        const { data } = yield octokit.rest.repos.listCommits(Object.assign(Object.assign({}, repo), { per_page: 1 }));
        return data[0].sha;
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        core.info(`GITHUB_JOB: ${process.env['GITHUB_JOB']}`);
        core.info(`GITHUB_STATE: ${process.env['GITHUB_STATE']}`);
        core.info(`process.exitCode: ${(_a = process.exitCode) === null || _a === void 0 ? void 0 : _a.toString()}`);
        if (!releaseId || !nextVersion)
            return;
        const nextTag = new tag_1.Tag(nextVersion);
        if (process.exitCode === 0) {
            const latestCommitSha = yield getLatestCommitSha();
            yield (0, github_1.updateTag)(nextTag, latestCommitSha);
            yield (0, github_1.updateRelease)(releaseId, latestCommitSha);
            yield (0, github_1.updateMajorTag)(nextTag, latestCommitSha);
        }
        else {
            yield (0, github_1.deleteRelease)(releaseId);
            yield (0, github_1.deleteTag)(nextTag);
        }
    });
}
run();
