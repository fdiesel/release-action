import { getInput } from '@actions/core';
import * as github from '@actions/github';
import {
  APIEmbedField,
  WebhookClient,
  WebhookMessageCreateOptions,
} from 'discord.js';

export async function releaseToDiscord(
  tag: string,
  version: string,
  content: string,
): Promise<void> {
  const webhooks = getInput('discord_webhooks')
    .split(',')
    .map((webhook) => webhook.trim())
    .filter((webhook) => webhook.length > 0);
  const appName = getInput('app_name') || undefined;
  const appUrl = getInput('app_url') || undefined;
  const color = getInput('discord_release_color') || undefined;
  const username = github.context.actor;
  const avatarURL = 'https://avatars.githubusercontent.com/' + username;
  const repo = github.context.repo.repo;
  const repoUrl = `https://github.com/${username}/${repo}`;
  const releaseUrl = `${repoUrl}/releases/tag/${tag}`;

  for (const webhook of webhooks) {
    const webhookClient = new WebhookClient({
      url: webhook,
    });
    const fields: APIEmbedField[] = [
      {
        name: 'version',
        value: version,
        inline: true,
      },
    ];
    if (appName || appUrl) {
      fields.unshift({
        name: 'app',
        value: appUrl ? `[${appName || appUrl}](${appUrl})` : appName!,
        inline: true,
      });
    }
    const options: WebhookMessageCreateOptions = {
      username,
      avatarURL,
      embeds: [
        {
          description:
            `### [\[${appName ?? `${username}/${repo}`}\] New release published: ${tag}](${releaseUrl})\n` +
            content,
          color: color ? parseInt(color.replace('#', ''), 16) : 0x1e1f22,
          fields,
        },
      ],
    };
    await webhookClient.send(options);
  }
}
