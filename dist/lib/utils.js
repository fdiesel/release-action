"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.determineNextVersion = determineNextVersion;
const commit_1 = require("./commit");
const version_1 = require("./version");
function determineNextVersion(prevVersion, commits, phase) {
    let nextVersion = null;
    const { hasBreakingChanges, type, preReleaseName } = commits.reduce((acc, commit) => {
        // skip commits outside of the conventional commit scope
        if (!commit.message)
            return acc;
        // set preReleaseName to the latest preReleaseName in the commits
        if (commit.preReleaseName && !acc.preReleaseName) {
            acc.preReleaseName = commit.preReleaseName;
        }
        // (first prio) handle braking changes
        if (commit.message.isBreakingChange) {
            acc.hasBreakingChanges = true;
            acc.type = commit_1.ConventionalCommitType.FEAT;
            return acc;
        }
        // (second prio) handle feat
        if (commit.message.type === commit_1.ConventionalCommitType.FEAT) {
            acc.type = commit_1.ConventionalCommitType.FEAT;
            return acc;
        }
        // (third prio) handle fix
        if (commit.message.type === commit_1.ConventionalCommitType.FIX &&
            acc.type !== commit_1.ConventionalCommitType.FEAT) {
            acc.type = commit_1.ConventionalCommitType.FIX;
        }
        return acc;
    }, {
        hasBreakingChanges: false,
        type: undefined,
        preReleaseName: undefined
    });
    if (!prevVersion || (prevVersion.major === 0 && phase === version_1.Phase.Prod)) {
        nextVersion = version_1.SemVer.init(phase);
        if (preReleaseName) {
            nextVersion = version_1.SemVer.bump(nextVersion, preReleaseName);
        }
        return nextVersion;
    }
    if (hasBreakingChanges && phase === version_1.Phase.Prod) {
        nextVersion = version_1.SemVer.bump(prevVersion, version_1.BumpTarget.Major);
    }
    else if (hasBreakingChanges && phase === version_1.Phase.Dev) {
        nextVersion = version_1.SemVer.bump(prevVersion, version_1.BumpTarget.Minor);
    }
    else if (type === commit_1.ConventionalCommitType.FEAT) {
        nextVersion = version_1.SemVer.bump(prevVersion, version_1.BumpTarget.Minor);
    }
    else if (type === commit_1.ConventionalCommitType.FIX && !preReleaseName) {
        nextVersion = version_1.SemVer.bump(prevVersion, version_1.BumpTarget.Patch);
    }
    if (preReleaseName) {
        nextVersion = version_1.SemVer.bump(nextVersion !== null && nextVersion !== void 0 ? nextVersion : prevVersion, preReleaseName);
    }
    return nextVersion;
}
