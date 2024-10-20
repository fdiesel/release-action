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
const tag_1 = require("./lib/tag");
const github_1 = require("./providers/github");
const status = core.getInput('_job_status');
const releaseId = core.getState('releaseId');
const prevVersion = core.getState('prevVersion');
const nextVersion = core.getState('nextVersion');
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const prevTag = prevVersion ? tag_1.Tag.parseVersion(prevVersion) : undefined;
        const nextTag = nextVersion ? tag_1.Tag.parseVersion(nextVersion) : undefined;
        const provider = new github_1.GitHubProvider(inputs_1.inputs.token);
        if (status === 'success') {
            const latestCommitSha = yield provider.getLatestCommitSha();
            if (releaseId && nextTag) {
                yield provider.tags.update(nextTag.ref, latestCommitSha);
                yield provider.releases.publish(releaseId, latestCommitSha);
            }
            const tag = nextTag || prevTag;
            if (tag && !tag.version.preRelease) {
                const remoteTag = yield provider.tags.get(tag.majorRef);
                if (remoteTag) {
                    yield provider.tags.update(tag.majorRef, latestCommitSha);
                }
                else {
                    yield provider.tags.create(tag.majorRef, latestCommitSha);
                }
            }
        }
        else {
            if (nextTag) {
                yield provider.releases.delete(releaseId);
                yield provider.tags.delete(nextTag.ref);
                if (prevTag && prevTag.version.major < nextTag.version.major) {
                    yield provider.branches.delete(new ref_1.Ref(ref_1.RefTypes.HEADS, `${nextTag.version.major}.x`));
                }
            }
        }
    });
}
run();
