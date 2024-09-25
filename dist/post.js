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
const child_process_1 = require("child_process");
const strategy_1 = require("./strategy");
const tag_1 = require("./tag");
const token = core.getInput('token');
const strategy = core.getInput('strategy')
    ? (0, strategy_1.parseStrategy)(core.getInput('strategy'))
    : undefined;
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
        if (!releaseId || !nextVersion)
            return;
        const nextTag = new tag_1.Tag(nextVersion);
        // strategies
        switch (strategy) {
            case strategy_1.Strategy.NODE:
                (0, child_process_1.execSync)(`git config user.name "GitHub Actions"`);
                (0, child_process_1.execSync)(`git config user.email "action@github.com"`);
                (0, child_process_1.execSync)(`npm version ${nextTag.version.toString()} -m "chore(node): bump version to %s" --allow-same-version`);
                (0, child_process_1.execSync)(`git push origin HEAD:${github.context.ref}`);
                break;
        }
        const latestCommitSha = yield getLatestCommitSha();
        // major tag
        const majorTagName = nextTag.toMajorString();
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
        core.info(`Tag created / updated: ${majorTagName}`);
        // release
        const { data } = yield octokit.rest.repos.updateRelease(Object.assign(Object.assign({}, repo), { release_id: parseInt(releaseId), draft: false, target_commitish: latestCommitSha }));
        core.info(`Release created: ${data.html_url}`);
    });
}
run();
