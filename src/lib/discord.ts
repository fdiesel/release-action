import { getInput } from '@actions/core';
import * as github from '@actions/github';
import {
  APIEmbedField,
  WebhookClient,
  WebhookMessageCreateOptions,
} from 'discord.js';

async function getAvatarUrl(username: string): Promise<string | undefined> {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`);
    const data = await response.json();
    return data.avatar_url;
  } catch (error) {
    void error;
    return undefined;
  }
}

export async function releaseToDiscord(
  version: string,
  content: string,
): Promise<void> {
  const webhooks = getInput('discord_webhooks')
    .split(',')
    .map((webhook) => webhook.trim());
  const appUrl = getInput('discord_release_app_url') || undefined;
  const color = getInput('discord_release_color') || undefined;
  const username = github.context.actor;
  const avatarURL = await getAvatarUrl(username);
  const repo = github.context.repo.repo;

  for (const webhook of webhooks) {
    const webhookClient = new WebhookClient({
      url: webhook,
    });
    const fields: APIEmbedField[] = [
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
