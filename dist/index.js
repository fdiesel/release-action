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
const commit_1 = require("./commit");
const release_1 = require("./release");
const tag_1 = require("./tag");
const version_1 = require("./version");
// inputs
const token = core.getInput('token');
// context
const repo = github.context.repo;
const octokit = github.getOctokit(token);
const baseUri = `${github.context.serverUrl}/${repo.owner}/${repo.repo}`;
function getLatestRelease() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { data: releases } = yield octokit.rest.repos.listReleases(Object.assign({}, repo));
            const chronologicalReleases = releases.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            return chronologicalReleases.length > 0 ? chronologicalReleases[0] : null;
        }
        catch (error) {
            if (error.status === 404)
                return null;
            core.setFailed(error.message);
        }
    });
}
function getLatestCommits(since) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data } = yield octokit.rest.repos.listCommits(Object.assign(Object.assign({}, repo), { sha: github.context.sha, since: since !== null && since !== void 0 ? since : undefined }));
        return data.map((commit) => new commit_1.Commit(commit.sha, commit.html_url, commit.commit.message));
    });
}
function createDraftRelease(prevTag, nextTag, commits) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data } = yield octokit.rest.repos.createRelease(Object.assign(Object.assign({}, repo), { tag_name: nextTag.toString(), name: nextTag.toString(), body: (0, release_1.createReleaseBody)(baseUri, prevTag, nextTag, commits), draft: true, prerelease: !!nextTag.version.preRelease }));
        core.info(`Release draft created: ${data.html_url}`);
        core.saveState('releaseId', data.id);
        core.saveState('nextVersion', nextTag.version.toString());
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const prevRelease = yield getLatestRelease();
        const prevTag = prevRelease ? new tag_1.Tag(prevRelease.tag_name) : undefined;
        const commits = yield getLatestCommits(prevRelease === null || prevRelease === void 0 ? void 0 : prevRelease.published_at);
        let nextVersion;
        if (prevTag) {
            nextVersion = prevTag.version;
            const latestPreReleaseName = (_a = commits.find((commit) => !!commit.preReleaseName)) === null || _a === void 0 ? void 0 : _a.preReleaseName;
            const preReleaseBumpTarget = latestPreReleaseName
                ? (0, version_1.parseBumpTarget)(latestPreReleaseName)
                : undefined;
            let mainBumpTarget;
            for (const commit of commits) {
                if (!commit.conventionalCommitMessage)
                    continue;
                const { type, isBreakingChange } = commit.conventionalCommitMessage;
                if (isBreakingChange) {
                    mainBumpTarget = version_1.BumpTarget.Major;
                    break;
                }
                if (type === commit_1.ConventionalCommitType.FEAT &&
                    (!mainBumpTarget || mainBumpTarget === version_1.BumpTarget.Patch)) {
                    mainBumpTarget = version_1.BumpTarget.Minor;
                }
                else if (type === commit_1.ConventionalCommitType.FIX && !mainBumpTarget) {
                    mainBumpTarget = version_1.BumpTarget.Patch;
                }
            }
            if (mainBumpTarget === version_1.BumpTarget.Major ||
                mainBumpTarget === version_1.BumpTarget.Minor ||
                (mainBumpTarget === version_1.BumpTarget.Patch && !preReleaseBumpTarget)) {
                nextVersion = version_1.SemVer.bump(nextVersion, mainBumpTarget);
            }
            if (preReleaseBumpTarget) {
                nextVersion = version_1.SemVer.bump(nextVersion, preReleaseBumpTarget);
            }
        }
        else {
            nextVersion = version_1.SemVer.first();
        }
        const nextTag = new tag_1.Tag(nextVersion.toString());
        core.setOutput('tag', nextTag.toString());
        core.setOutput('version', nextTag.version.toString());
        core.setOutput('major', nextTag.version.major.toString());
        if ((prevTag === null || prevTag === void 0 ? void 0 : prevTag.toString()) !== nextTag.toString()) {
            createDraftRelease(prevTag, nextTag, commits);
            core.setOutput('created', true);
            core.setOutput('pre-release', (_b = nextTag.version.preRelease) === null || _b === void 0 ? void 0 : _b.toString());
        }
        else {
            core.setOutput('created', false);
            core.setOutput('pre-release', undefined);
        }
    });
}
run();
