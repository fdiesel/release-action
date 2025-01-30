"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ref = exports.RefTypes = void 0;
var RefTypes;
(function (RefTypes) {
    RefTypes["HEADS"] = "heads";
    RefTypes["TAGS"] = "tags";
    RefTypes["PULL"] = "pull";
    RefTypes["NOTES"] = "notes";
    RefTypes["REMOTES"] = "remotes";
})(RefTypes || (exports.RefTypes = RefTypes = {}));
class Ref {
    constructor(type, name) {
        this.type = type;
        this.name = name;
        this.shortened = `${type}/${name}`;
        this.fullyQualified = `refs/${this.shortened}`;
    }
    toString() {
        return this.fullyQualified;
    }
}
exports.Ref = Ref;
