"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tag = void 0;
const core_1 = require("@actions/core");
const version_1 = require("./version");
class Tag {
    constructor(name) {
        this.prefix = (0, core_1.getInput)('prefix');
        if (name.startsWith(this.prefix)) {
            this.version = version_1.SemVer.fromString(name.substring(this.prefix.length));
        }
        else {
            this.version = version_1.SemVer.fromString(name);
        }
    }
    toMajorString() {
        return `${this.prefix}${this.version.major}`;
    }
    toString() {
        return `${this.prefix}${this.version.toString()}`;
    }
}
exports.Tag = Tag;
