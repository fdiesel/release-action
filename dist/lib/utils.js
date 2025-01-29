"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.determineNextVersion = determineNextVersion;
const semver_1 = require("semver");
const commit_1 = require("./commit");
const phase_1 = require("./phase");
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
        preReleaseName: undefined,
    });
    if (!prevVersion || (prevVersion.major === 0 && phase === phase_1.Phase.Prod)) {
        switch (phase) {
            case phase_1.Phase.Prod:
                if (preReleaseName) {
                    return new semver_1.SemVer("1.0.0-" + preReleaseName + ".0");
                }
                else {
                    return new semver_1.SemVer("1.0.0");
                }
            case phase_1.Phase.Dev:
                if (preReleaseName) {
                    return new semver_1.SemVer("0.1.0-" + preReleaseName + ".0");
                }
                else {
                    return new semver_1.SemVer("0.1.0");
                }
        }
    }
    if (hasBreakingChanges && phase === phase_1.Phase.Prod) {
        nextVersion = prevVersion.inc("major");
    }
    else if (hasBreakingChanges && phase === phase_1.Phase.Dev) {
        nextVersion = prevVersion.inc("minor");
    }
    else if (type === commit_1.ConventionalCommitType.FEAT) {
        nextVersion = prevVersion.inc("minor");
    }
    else if (type === commit_1.ConventionalCommitType.FIX && !preReleaseName) {
        nextVersion = prevVersion.inc("patch");
    }
    if (preReleaseName && nextVersion) {
        nextVersion = nextVersion.inc("prerelease", preReleaseName);
    }
    else if (preReleaseName && prevVersion) {
        nextVersion = prevVersion.inc("prerelease", preReleaseName);
    }
    return nextVersion;
}
