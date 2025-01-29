"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Commit = exports.ConventionalCommitMessage = exports.parseConventionalCommitType = exports.ConventionalCommitType = void 0;
const parser_1 = require("./parser");
const providers_1 = require("./providers");
var ConventionalCommitType;
(function (ConventionalCommitType) {
    ConventionalCommitType["BREAKING_CHANGE"] = "BREAKING CHANGE";
    ConventionalCommitType["FEAT"] = "feat";
    ConventionalCommitType["FIX"] = "fix";
})(ConventionalCommitType || (exports.ConventionalCommitType = ConventionalCommitType = {}));
exports.parseConventionalCommitType = (0, parser_1.enumParserFactory)(ConventionalCommitType, (type) => type.toLowerCase(), (value) => value.toLowerCase().replace("-", " "));
class ConventionalCommitMessage {
    constructor({ message, type, isBreakingChange, header, scope, }) {
        this.message = message;
        this.header = header;
        this.type = type;
        this.isBreakingChange = isBreakingChange;
        this.scope = scope;
    }
    static parse(message) {
        const { type, scope, exclamation, header } = this.decomposeMessage(message);
        const isBreakingChange = exclamation === "!" || this.includesBreakingChange(message);
        if (!type || !header) {
            throw new Error(`Invalid conventional commit message: ${message}`);
        }
        return new ConventionalCommitMessage({
            message,
            type: (0, exports.parseConventionalCommitType)(type),
            isBreakingChange: isBreakingChange,
            header,
            scope,
        });
    }
    toString() {
        return this.message;
    }
}
exports.ConventionalCommitMessage = ConventionalCommitMessage;
ConventionalCommitMessage.decomposeMessage = (0, parser_1.matchWithRegexFactory)(RegExp(String.raw `^(${[
    ...Object.values(ConventionalCommitType),
    ...Object.values(ConventionalCommitType)
        .filter((type) => type.includes(" "))
        .map((type) => type.replace(" ", "-")),
].join("|")})(?:\((.+)\))?(?:(\!))?\: (.+)`, "i"), "type", "scope", "exclamation", "header");
ConventionalCommitMessage.includesBreakingChange = (0, parser_1.testWithRegexFactory)(/BREAKING( |-)CHANGES?:/i);
class Commit extends providers_1.ProviderSource {
    constructor(source, plainMessage, sha, uri, id) {
        super(source);
        this.sha = sha;
        this.uri = uri;
        this.id = id;
        const { preReleaseName } = Commit.findPreReleaseName(plainMessage);
        this.preReleaseName = preReleaseName;
        try {
            this.message = ConventionalCommitMessage.parse(plainMessage);
        }
        catch (_) {
            this.message = undefined;
        }
    }
}
exports.Commit = Commit;
Commit.findPreReleaseName = (0, parser_1.matchWithRegexFactory)(/\((alpha|beta|rc)\)/i, "preReleaseName");
