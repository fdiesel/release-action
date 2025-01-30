"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseToDiscord = releaseToDiscord;
const core_1 = require("@actions/core");
const github = __importStar(require("@actions/github"));
const discord_js_1 = require("discord.js");
function getAvatarUrl(username) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(`https://api.github.com/users/${username}`);
            const data = yield response.json();
            return data.avatar_url;
        }
        catch (error) {
            void error;
            return undefined;
        }
    });
}
function releaseToDiscord(version, content) {
    return __awaiter(this, void 0, void 0, function* () {
        const webhooks = (0, core_1.getInput)('discord_webhooks')
            .split(',')
            .map((webhook) => webhook.trim());
        const appUrl = (0, core_1.getInput)('discord_release_app_url') || undefined;
        const color = (0, core_1.getInput)('discord_release_color') || undefined;
        const username = github.context.actor;
        const avatarURL = yield getAvatarUrl(username);
        const repo = github.context.repo.repo;
        for (const webhook of webhooks) {
            const webhookClient = new discord_js_1.WebhookClient({
                url: webhook,
            });
            const fields = [
                {
                    name: 'repo',
                    value: repo,
                    inline: true,
                },
                {
                    name: 'version',
                    value: version,
                    inline: true,
                },
            ];
            if (appUrl) {
                fields.push({
                    name: 'app',
                    value: appUrl,
                    inline: true,
                });
            }
            const options = {
                username,
                avatarURL,
                embeds: [
                    {
                        title: 'Release',
                        description: content,
                        color: color ? parseInt(color.replace('#', ''), 16) : undefined,
                        fields,
                    },
                ],
            };
            yield webhookClient.send(options);
        }
    });
}
