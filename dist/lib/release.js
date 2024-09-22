"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReleaseProdBody = exports.ReleaseDevBody = exports.ReleaseBody = void 0;
const commit_1 = require("./commit");
class ReleaseBody {
    constructor(baseUri, prevTag, nextTag, sections) {
        this.content = [
            ReleaseBody.createHeader(baseUri, prevTag, nextTag),
            ...sections.filter((section) => section !== null)
        ].join('\n');
    }
    static createHeader(baseUri, prevTag, nextTag) {
        const compareUri = prevTag
            ? `${baseUri}/compare/${prevTag.toString()}...${nextTag.toString()}`
            : undefined;
        return `# ${compareUri ? `[${nextTag.toString()}](${compareUri})` : nextTag.toString()} (${new Date().toISOString().split('T')[0]})`;
    }
    static createTypeSection(title, commits, filter) {
        const filteredCommits = commits.filter((commit) => commit.message && filter(commit.message));
        if (!filteredCommits.length)
            return null;
        return `### ${title}\n${filteredCommits
            .map((commit) => {
            var _a;
            return `- ${((_a = commit.message) === null || _a === void 0 ? void 0 : _a.scope) ? commit.message.scope + ': ' : ''}${commit.message.header} ([${commit.id}](${commit.uri}))`;
        })
            .join('\n')}`;
    }
    toString() {
        return this.content;
    }
}
exports.ReleaseBody = ReleaseBody;
class ReleaseDevBody extends ReleaseBody {
    constructor(baseUri, prevTag, nextTag, commits) {
        const sections = [
            ReleaseBody.createTypeSection('⚠ BREAKING CHANGES', commits, (commit) => commit.isBreakingChange),
            ReleaseBody.createTypeSection('Features', commits, (commit) => commit.type === commit_1.ConventionalCommitType.FEAT),
            ReleaseBody.createTypeSection('Bug Fixes', commits, (commit) => commit.type === commit_1.ConventionalCommitType.FIX)
        ];
        super(baseUri, prevTag, nextTag, sections);
    }
}
exports.ReleaseDevBody = ReleaseDevBody;
class ReleaseProdBody extends ReleaseBody {
    constructor(baseUri, prevTag, nextTag, commits) {
        const sections = [
            ReleaseBody.createTypeSection('Features', commits, (commit) => commit.type === commit_1.ConventionalCommitType.FEAT)
        ];
        super(baseUri, prevTag, nextTag, sections);
    }
}
exports.ReleaseProdBody = ReleaseProdBody;
