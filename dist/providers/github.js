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
exports.GitHubProvider = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const commit_1 = require("../lib/commit");
const ref_1 = require("../lib/ref");
const tag_1 = require("../lib/tag");
class GitHubCommit extends commit_1.Commit {
    constructor(commit) {
        super(commit, commit.commit.message, commit.sha, commit.html_url, commit.sha.substring(0, 7));
    }
}
class GitHubAction {
    constructor(octokit) {
        this.repo = github.context.repo;
        this.octokit = octokit;
        const branchRefPrefix = 'refs/heads/';
        const branchName = github.context.ref.split(branchRefPrefix).pop();
        this.branchRef = new ref_1.Ref(ref_1.RefTypes.HEADS, branchName);
    }
}
class GitHubProvider extends GitHubAction {
    constructor(token) {
        const octokit = github.getOctokit(token);
        super(octokit);
        this.tags = new GitHubRefs(this.octokit);
        this.branches = new GitHubRefs(this.octokit);
        this.releases = new GitHubReleases(this.octokit);
        this.baseUri = `${github.context.serverUrl}/${this.repo.owner}/${this.repo.repo}`;
        core.debug(`Initialized GitHub Provider on branch: '${this.branchRef.name}'`);
    }
    getPrevTag() {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug('Getting previous tag');
            const { data } = yield this.octokit.rest.repos.listTags(Object.assign(Object.assign({}, this.repo), { per_page: 1 }));
            core.debug(`Previous tag: '${data.length > 0 ? data[0].name : ''}'`);
            return data.length > 0 ? tag_1.Tag.parseTag(data[0].name) : undefined;
        });
    }
    /**
     * Get commits since a given tag or from the beginning of the branch
     * @param sinceTag only get commits after this tag
     * @returns commits ordered from newest to oldest
     */
    getCommits(sinceTag) {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug(`Getting commits since '${sinceTag ? sinceTag.toString() : 'beginning'}'`);
            if (sinceTag) {
                const { data } = yield this.octokit.rest.repos.compareCommits(Object.assign(Object.assign({}, this.repo), { head: this.branchRef.name, base: sinceTag.ref.fullyQualified }));
                core.debug(`Received commits: ${data.commits.length}`);
                return data.commits.reverse().map((commit) => new GitHubCommit(commit));
            }
            else {
                const { data } = yield this.octokit.rest.repos.listCommits(Object.assign(Object.assign({}, this.repo), { head: this.branchRef.name, sha: this.branchRef.name }));
                core.debug(`Received commits: ${data.length}`);
                return data.map((commit) => new GitHubCommit(commit));
            }
        });
    }
    getTagCommitSha(tag) {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug(`Getting commit SHA for tag '${tag.toString()}'`);
            const { data } = yield this.octokit.rest.git.getRef(Object.assign(Object.assign({}, this.repo), { ref: tag.ref.shortened }));
            core.debug(`Received commit SHA: '${data.object.sha}'`);
            return data.object.sha;
        });
    }
    getLatestCommitSha() {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug('Getting latest commit SHA');
            const { data } = yield this.octokit.rest.repos.getCommit(Object.assign(Object.assign({}, this.repo), { ref: this.branchRef.name }));
            core.debug(`Received latest commit SHA: '${data.sha}'`);
            return data.sha;
        });
    }
}
exports.GitHubProvider = GitHubProvider;
class GitHubRefs extends GitHubAction {
    constructor(octokit) {
        super(octokit);
    }
    get(ref) {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug(`Getting ref: '${ref}'`);
            try {
                const { data } = yield this.octokit.rest.git.getRef(Object.assign(Object.assign({}, this.repo), { ref: ref.shortened }));
                core.debug(`Received ref: '${data.ref}'`);
                return data;
            }
            catch (error) {
                if ((error === null || error === void 0 ? void 0 : error.status) === 404) {
                    core.debug(`Received ref: undefined`);
                    return undefined;
                }
                else {
                    core.setFailed(error === null || error === void 0 ? void 0 : error.message);
                    throw error;
                }
            }
        });
    }
    create(ref, sha) {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug(`Creating ref: '${ref}'`);
            yield this.octokit.rest.git.createRef(Object.assign(Object.assign({}, this.repo), { ref: ref.fullyQualified, sha }));
            core.info(`Ref created: ${ref}`);
        });
    }
    update(ref, sha) {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug(`Updating ref: '${ref}'`);
            yield this.octokit.rest.git.updateRef(Object.assign(Object.assign({}, this.repo), { ref: ref.shortened, sha }));
            core.info(`Ref updated: ${ref}`);
        });
    }
    delete(ref) {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug(`Deleting ref: '${ref}'`);
            yield this.octokit.rest.git.deleteRef(Object.assign(Object.assign({}, this.repo), { ref: ref.shortened }));
            core.info(`Ref deleted: ${ref}`);
        });
    }
}
class GitHubReleases extends GitHubAction {
    constructor(octokit) {
        super(octokit);
    }
    draft(nextTag, body) {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug(`Drafting release: '${nextTag.toString()}'`);
            const { data } = yield this.octokit.rest.repos.createRelease(Object.assign(Object.assign({}, this.repo), { tag_name: nextTag.toString(), name: nextTag.toString(), body, prerelease: !!nextTag.version.preRelease, draft: true }));
            core.info(`Release drafted: ${data.id.toString()}`);
            return data.id.toString();
        });
    }
    publish(id, sha) {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug(`Publishing release: '${id}'`);
            yield this.octokit.rest.repos.updateRelease(Object.assign(Object.assign({}, this.repo), { release_id: parseInt(id), target_commitish: sha, draft: false }));
            core.info(`Release published: ${id}`);
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug(`Deleting release: '${id}'`);
            yield this.octokit.rest.repos.deleteRelease(Object.assign(Object.assign({}, this.repo), { release_id: parseInt(id) }));
            core.info(`Release deleted: ${id}`);
        });
    }
}
