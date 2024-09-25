"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReleaseBody = createReleaseBody;
const commit_1 = require("./commit");
function createHeader(baseUri, prevTag, nextTag) {
    const compareUri = prevTag
        ? `${baseUri}/compare/${prevTag.toString()}...${nextTag.toString()}`
        : undefined;
    return `# ${compareUri ? `[${nextTag.toString()}](${compareUri})` : nextTag.toString()} (${new Date().toISOString().split('T')[0]})`;
}
function createTypeSection(title, commits, filter) {
    const filteredCommits = commits.filter((commit) => commit.conventionalCommitMessage &&
        filter(commit.conventionalCommitMessage));
    if (!filteredCommits.length)
        return null;
    return `### ${title}\n${filteredCommits
        .map((commit) => {
        var _a;
        return `- ${((_a = commit.conventionalCommitMessage) === null || _a === void 0 ? void 0 : _a.scope)
            ? commit.conventionalCommitMessage.scope + ': '
            : ''}${commit.conventionalCommitMessage.header} ([${commit.ref}](${commit.url}))`;
    })
        .join('\n')}`;
}
function createReleaseBody(baseUri, prevTag, nextTag, commits) {
    return [
        createHeader(baseUri, prevTag, nextTag),
        ...[
            createTypeSection('⚠ BREAKING CHANGES', commits, (commit) => commit.isBreakingChange),
            createTypeSection('Features', commits, (commit) => commit.type === commit_1.ConventionalCommitType.FEAT),
            createTypeSection('Bug Fixes', commits, (commit) => commit.type === commit_1.ConventionalCommitType.FIX)
        ].filter((section) => section !== null)
    ].join('\n');
}
