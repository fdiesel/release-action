"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemVer = exports.SemVerPreRelease = exports.parseBumpTarget = exports.BumpTarget = exports.parseSemVerPreReleaseName = exports.SemVerPreReleaseName = void 0;
const core_1 = require("@actions/core");
const parser_1 = require("./parser");
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
        this._name = name;
        this._version = version;
    }
    toString() {
        return `${this._name}${this._version > 0 ? `.${this._version}` : ''}`;
    }
    static bump(preRelease, name) {
        if (preRelease._name !== name) {
            return new SemVerPreRelease(name);
        }
        else {
            return new SemVerPreRelease(name, preRelease._version + 1);
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
    static first() {
        return SemVer.fromString((0, core_1.getInput)('first'));
    }
    static fromString(version) {
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
            default:
                throw new Error(`Invalid target: ${target}`);
        }
    }
}
exports.SemVer = SemVer;
SemVer.matchSemVer = (0, parser_1.matchWithRegexFactory)(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([alpha|beta|rc]+)(?:\.(\d+))?)?$/, 'major', 'minor', 'patch', 'preReleaseName', 'preReleaseVersion');
