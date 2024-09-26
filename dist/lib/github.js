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
exports.getLatestChronologicalRelease = getLatestChronologicalRelease;
exports.getLatestCommits = getLatestCommits;
exports.draftRelease = draftRelease;
exports.updateMajorTag = updateMajorTag;
exports.updateTag = updateTag;
exports.deleteTag = deleteTag;
exports.finalizeRelease = finalizeRelease;
exports.deleteRelease = deleteRelease;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const commit_1 = require("./commit");
const release_1 = require("./release");
const token = core.getInput('token');
const repo = github.context.repo;
const octokit = github.getOctokit(token);
const baseUri = `${github.context.serverUrl}/${repo.owner}/${repo.repo}`;
function getLatestChronologicalRelease() {
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
function draftRelease(prevTag, nextTag, commits) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data } = yield octokit.rest.repos.createRelease(Object.assign(Object.assign({}, repo), { tag_name: nextTag.toString(), name: nextTag.toString(), body: (0, release_1.createReleaseBody)(baseUri, prevTag, nextTag, commits), prerelease: !!nextTag.version.preRelease, draft: true }));
        core.info(`Release created: ${data.html_url}`);
        core.saveState('releaseId', data.id);
        core.saveState('nextVersion', nextTag.version.toString());
    });
}
function updateMajorTag(tag, latestCommitSha) {
    return __awaiter(this, void 0, void 0, function* () {
        const majorTagName = tag.toMajorString();
        let majorTag;
        try {
            const { data } = yield octokit.rest.git.getRef(Object.assign(Object.assign({}, repo), { ref: `tags/${majorTagName}` }));
            majorTag = data;
        }
        catch (error) {
            if (error.status !== 404) {
                throw error;
            }
            majorTag = undefined;
        }
        if (majorTag) {
            yield octokit.rest.git.updateRef(Object.assign(Object.assign({}, repo), { ref: `tags/${majorTagName}`, sha: latestCommitSha }));
        }
        else {
            yield octokit.rest.git.createRef(Object.assign(Object.assign({}, repo), { ref: `refs/tags/${majorTagName}`, sha: latestCommitSha }));
        }
        core.info(`Major tag sha updated: ${majorTagName}`);
    });
}
function updateTag(tag, latestCommitSha) {
    return __awaiter(this, void 0, void 0, function* () {
        yield octokit.rest.git.updateRef(Object.assign(Object.assign({}, repo), { ref: `tags/${tag.toString()}`, sha: latestCommitSha }));
        core.info(`Tag sha updated: ${tag.toString()}`);
    });
}
function deleteTag(tag) {
    return __awaiter(this, void 0, void 0, function* () {
        yield octokit.rest.git.deleteRef(Object.assign(Object.assign({}, repo), { ref: `tags/${tag.toString()}` }));
        core.info(`Tag deleted: ${tag.toString()}`);
    });
}
function finalizeRelease(releaseId, latestCommitSha) {
    return __awaiter(this, void 0, void 0, function* () {
        yield octokit.rest.repos.updateRelease(Object.assign(Object.assign({}, repo), { release_id: parseInt(releaseId), target_commitish: latestCommitSha, draft: false }));
        core.info(`Release sha updated: ${releaseId}`);
    });
}
function deleteRelease(releaseId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield octokit.rest.repos.deleteRelease(Object.assign(Object.assign({}, repo), { release_id: parseInt(releaseId) }));
        core.info(`Release deleted: ${releaseId}`);
    });
}
