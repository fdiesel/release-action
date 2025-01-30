"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tag = void 0;
const semver_1 = __importDefault(require("semver"));
const ref_1 = require("./ref");
class Tag {
    constructor(version) {
        this.version = version;
        this.ref = new ref_1.Ref(ref_1.RefTypes.TAGS, this.toString());
        this.majorRef = new ref_1.Ref(ref_1.RefTypes.TAGS, this.toMajorString());
    }
    static parseTag(tag) {
        const versionString = tag.substring(Tag.PREFIX.length);
        return Tag.parseVersion(versionString);
    }
    static parseVersion(versionString) {
        const version = semver_1.default.parse(versionString);
        if (!version)
            throw new Error(`Invalid version: ${versionString}`);
        return new Tag(version);
    }
    toMajorString() {
        return `${Tag.PREFIX}${this.version.major}`;
    }
    toString() {
        return `${Tag.PREFIX}${this.version.toString()}`;
    }
}
exports.Tag = Tag;
Tag.PREFIX = 'v';
