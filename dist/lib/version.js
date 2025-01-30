"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemVer = exports.SemVerPreRelease = exports.parseBumpTarget = exports.BumpTarget = exports.parseSemVerPreReleaseName = exports.SemVerPreReleaseName = void 0;
const parser_1 = require("./parser");
const phase_1 = require("./phase");
var SemVerPreReleaseName;
(function (SemVerPreReleaseName) {
    SemVerPreReleaseName["Alpha"] = "alpha";
    SemVerPreReleaseName["Beta"] = "beta";
    SemVerPreReleaseName["Rc"] = "rc";
})(SemVerPreReleaseName || (exports.SemVerPreReleaseName = SemVerPreReleaseName = {}));
exports.parseSemVerPreReleaseName = (0, parser_1.enumParserFactory)(SemVerPreReleaseName, (type) => type.toLowerCase(), (value) => value.toLowerCase());
var BumpTarget;
(function (BumpTarget) {
    BumpTarget["Major"] = "major";
    BumpTarget["Minor"] = "minor";
    BumpTarget["Patch"] = "patch";
    BumpTarget["Alpha"] = "alpha";
    BumpTarget["Beta"] = "beta";
    BumpTarget["Rc"] = "rc";
})(BumpTarget || (exports.BumpTarget = BumpTarget = {}));
exports.parseBumpTarget = (0, parser_1.enumParserFactory)(BumpTarget, (type) => type.toLowerCase(), (value) => value.toLowerCase());
class SemVerPreRelease {
    constructor(name, version = 0) {
        this.name = name;
        this.version = version;
    }
    toString() {
        return `${this.name}${this.version > 0 ? `.${this.version}` : ''}`;
    }
    static bump(preRelease, name) {
        if (preRelease.name !== name) {
            return new SemVerPreRelease(name);
        }
        else {
            return new SemVerPreRelease(name, preRelease.version + 1);
        }
    }
}
exports.SemVerPreRelease = SemVerPreRelease;
class SemVer {
    constructor(major, minor, patch, preRelease) {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
        this.preRelease = preRelease || null;
    }
    toString() {
        return (`${this.major}.${this.minor}.${this.patch}` +
            (this.preRelease ? `-${this.preRelease.toString()}` : ''));
    }
    static init(phase) {
        switch (phase) {
            case phase_1.Phase.Prod:
                return new SemVer(1, 0, 0);
            case phase_1.Phase.Dev:
                return new SemVer(0, 1, 0);
        }
    }
    static parse(version) {
        const { major, minor, patch, preReleaseName, preReleaseVersion } = this.matchSemVer(version);
        if (!major || !minor || !patch) {
            throw new Error(`Invalid semver: '${version}'`);
        }
        return new SemVer(parseInt(major), parseInt(minor), parseInt(patch), preReleaseName
            ? new SemVerPreRelease((0, exports.parseSemVerPreReleaseName)(preReleaseName), preReleaseVersion ? parseInt(preReleaseVersion) : undefined)
            : undefined);
    }
    static bump(version, target) {
        switch (target) {
            case BumpTarget.Major:
                return new SemVer(version.major + 1, 0, 0);
            case BumpTarget.Minor:
                return new SemVer(version.major, version.minor + 1, 0);
            case BumpTarget.Patch:
                return new SemVer(version.major, version.minor, version.patch + 1);
            case BumpTarget.Alpha:
            case BumpTarget.Beta:
            case BumpTarget.Rc:
            case SemVerPreReleaseName.Alpha:
            case SemVerPreReleaseName.Beta:
            case SemVerPreReleaseName.Rc:
                const preReleaseName = (0, exports.parseSemVerPreReleaseName)(target);
                if (!version.preRelease)
                    return new SemVer(version.major, version.minor, version.patch, new SemVerPreRelease(preReleaseName));
                else
                    return new SemVer(version.major, version.minor, version.patch, SemVerPreRelease.bump(version.preRelease, preReleaseName));
        }
    }
}
exports.SemVer = SemVer;
SemVer.matchSemVer = (0, parser_1.matchWithRegexFactory)(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([alpha|beta|rc]+)(?:\.(0|[1-9]\d*))?)?$/, 'major', 'minor', 'patch', 'preReleaseName', 'preReleaseVersion');
