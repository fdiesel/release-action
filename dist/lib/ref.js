"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ref = void 0;
class Ref {
    constructor(type, name) {
        this.type = type;
        this.name = name;
        this.shortened = `${type}/${name}`;
        this.fullyQualified = `refs/${this.shortened}`;
    }
}
exports.Ref = Ref;
