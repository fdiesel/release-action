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
exports.GitHub = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const commit_1 = require("./lib/commit");
const release_1 = require("./lib/release");
const tag_1 = require("./lib/tag");
class GitHubCommit extends commit_1.Commit {
    constructor(commit) {
        super(commit, commit.commit.message, commit.sha, commit.html_url, commit.sha.substring(0, 7));
    }
}
class GitHubAction {
    constructor(octokit) {
        this.repo = github.context.repo;
        this.octokit = octokit;
        this.baseUri = `${github.context.serverUrl}/${this.repo.owner}/${this.repo.repo}`;
        // get branch name of the workflow
        const branchRefPrefix = 'refs/heads/';
        this.branchName = github.context.ref.split(branchRefPrefix).pop();
        this.branchRef = `${branchRefPrefix}${this.branchName}`;
        // // Check if the event is a pull request
        // if (github.context.payload.pull_request) {
        //   // For pull request events, use the source branch (head branch)
        //   this.branch = github.context.payload.pull_request.head.ref;
        // } else {
        //   // For other events (like push), use the ref and remove 'refs/heads/' prefix
        //   const ref = github.context.ref;
        //   if (ref.startsWith('refs/heads/')) {
        //     this.branch = ref.replace('refs/heads/', ''); // Return the branch name for push events
        //   } else if (ref.startsWith('refs/tags/')) {
        //     this.branch = ref.replace('refs/tags/', ''); // Handle tags if needed
        //   }
        //   throw new Error('Could not determine the branch name from the context.');
        // }
    }
}
class GitHub extends GitHubAction {
    constructor(token) {
        const octokit = github.getOctokit(token);
        super(octokit);
        this.tags = new GitHubRefs(this.octokit);
        this.branches = new GitHubRefs(this.octokit);
        this.releases = new GitHubReleases(this.octokit);
    }
    getPrevTag() {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.octokit.rest.repos.listTags(Object.assign(Object.assign({}, this.repo), { per_page: 1 }));
            return data.length > 0 ? tag_1.Tag.parseTag(data[0].name) : undefined;
        });
    }
    getCommits(sinceTag) {
        return __awaiter(this, void 0, void 0, function* () {
            if (sinceTag) {
                const { data } = yield this.octokit.rest.repos.compareCommits(Object.assign(Object.assign({}, this.repo), { base: sinceTag.fqRef, head: this.branchRef }));
                return data.commits.map((commit) => new GitHubCommit(commit));
            }
            else {
                const { data } = yield this.octokit.rest.repos.listCommits(Object.assign(Object.assign({}, this.repo), { sha: this.branchName }));
                return data.map((commit) => new GitHubCommit(commit));
            }
        });
    }
    getTagCommitSha(tag) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.octokit.rest.git.getRef(Object.assign(Object.assign({}, this.repo), { ref: `tags/${tag.toString()}` }));
            return data.object.sha;
        });
    }
    getLatestCommitSha() {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.octokit.rest.repos.getCommit(Object.assign(Object.assign({}, this.repo), { ref: this.branchRef }));
            return data.sha;
        });
    }
}
exports.GitHub = GitHub;
class GitHubRefs extends GitHubAction {
    constructor(octokit) {
        super(octokit);
    }
    create(ref, sha) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.octokit.rest.git.createRef(Object.assign(Object.assign({}, this.repo), { ref, sha }));
            core.info(`Ref created: ${ref}`);
        });
    }
    update(ref, sha) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.octokit.rest.git.updateRef(Object.assign(Object.assign({}, this.repo), { ref, sha }));
            core.info(`Ref updated: ${ref}`);
        });
    }
    save(ref, sha) {
        return __awaiter(this, void 0, void 0, function* () {
            let refAlreadyExists = false;
            try {
                yield this.octokit.rest.git.getRef(Object.assign(Object.assign({}, this.repo), { ref }));
                refAlreadyExists = true;
            }
            catch (error) {
                if (error.status !== 404) {
                    core.setFailed(error.message);
                    throw error;
                }
            }
            if (refAlreadyExists) {
                yield this.update(ref, sha);
            }
            else {
                yield this.create(ref, sha);
            }
        });
    }
    delete(ref) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.octokit.rest.git.deleteRef(Object.assign(Object.assign({}, this.repo), { ref }));
            core.info(`Ref deleted: ${ref}`);
        });
    }
}
class GitHubReleases extends GitHubAction {
    constructor(octokit) {
        super(octokit);
    }
    draft(prevTag, nextTag, commits) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.octokit.rest.repos.createRelease(Object.assign(Object.assign({}, this.repo), { tag_name: nextTag.toString(), name: nextTag.toString(), body: new release_1.ReleaseBody(this.baseUri, prevTag, nextTag, commits).toString(), prerelease: !!nextTag.version.preRelease, draft: true }));
            core.info(`Release drafted: ${data.id.toString()}`);
            return data.id.toString();
        });
    }
    publish(id, sha) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.octokit.rest.repos.updateRelease(Object.assign(Object.assign({}, this.repo), { release_id: parseInt(id), target_commitish: sha, draft: false }));
            core.info(`Release published: ${id}`);
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.octokit.rest.repos.deleteRelease(Object.assign(Object.assign({}, this.repo), { release_id: parseInt(id) }));
            core.info(`Release deleted: ${id}`);
        });
    }
}
