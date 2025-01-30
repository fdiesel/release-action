import { getInput } from '@actions/core';
import * as github from '@actions/github';
import {
  APIEmbedField,
  WebhookClient,
  WebhookMessageCreateOptions,
} from 'discord.js';

export async function releaseToDiscord(
  tag: string,
  content: string,
): Promise<void> {
  const webhooks = getInput('discord_webhooks')
    .split(',')
    .map((webhook) => webhook.trim());
  const appUrl = getInput('discord_release_app_url') || undefined;
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
        name: 'repo',
        value: `[${repo}](${repoUrl})`,
        inline: true,
      },
      {
        name: 'tag',
        value: `[${tag}](${releaseUrl})`,
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
    const options: WebhookMessageCreateOptions = {
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
    await webhookClient.send(options);
  }
}
