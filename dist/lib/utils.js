"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.displayVersion = displayVersion;
const core_1 = require("@actions/core");
const github_1 = require("@actions/github");
function displayVersion() {
    (0, core_1.info)(`${github_1.context.repo.owner}/${github_1.context.repo.repo}@${require('../../package.json').version}`);
}
