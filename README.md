# Slack Send GitHub Action


Forked from https://github.com/slackapi/slack-github-action.

Send data into Slack using this GitHub Action!

This action is intended for internal usage only.

## Sending Variables

You can send GitHub-specific data related to GitHub Action workflow events using [GitHub Contexts](https://docs.github.com/en/actions/learn-github-actions/contexts) and [Variables](https://docs.github.com/en/actions/learn-github-actions/variables) that GitHub Actions provides.

For examples on how to leverage this in your workflows, check out the [example workflows we have](https://github.com/slackapi/slack-github-action/tree/main/example-workflows).

## How to Send Data to Slack

This package has three different techniques to send data to Slack:

1) Send data to Slack's Workflow Builder (requires a paid Slack instance).
2) Send data via a Slack app to post to a specific channel (use an existing custom app or create a new one).
3) Send data via a Slack Incoming Webhook URL (use an existing custom app or create a new one).

The recommended way to use this action is with Slack's Workflow Builder (if you're on a paid Slack plan).

### Technique 1: Slack Workflow Builder

Removed

### Technique 2: Slack App

By creating a new Slack app or using an existing one, this approach allows your GitHub Actions job to post a message in a Slack channel or direct message by utilizing the [chat.postMessage](https://api.slack.com/methods/chat.postMessage) API method. Using this approach you can instantly post a message without setting up Slack workflows.

#### Setup

* [Create a Slack App][apps] for your workspace (alternatively use an existing app you have already created and installed).
* Add the [`chat:write`](https://api.slack.com/scopes/chat:write) bot scope under **OAuth & Permissions**.
* Install the app to your workspace.
* Copy the app's Bot Token from the **OAuth & Permissions** page and [add it as a secret in your repo settings][repo-secret] named `SLACK_BOT_TOKEN`.
* Invite the bot user into the channel you wish to post messages to (`/invite @bot_user_name`).

#### Usage

Add this Action as a [step][job-step] to your project's GitHub Action Workflow file:

```yaml
- name: Post to a Slack channel
  id: slack
  uses: slackapi/slack-github-action@v1.24.0
  with:
    # Slack channel id, channel name, or user id to post message.
    # See also: https://api.slack.com/methods/chat.postMessage#channels
    # You can pass in multiple channels to post to by providing a comma-delimited list of channel IDs.
    channel-id: 'CHANNEL_ID,ANOTHER_CHANNEL_ID'
    # For posting a simple plain text message
    slack-message: "GitHub build result: ${{ job.status }}\n${{ github.event.pull_request.html_url || github.event.head_commit.url }}"
  env:
    SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

Using JSON payload for constructing a message is also available:

```yaml
- name: Post to a Slack channel
  id: slack
  uses: slackapi/slack-github-action@v1.24.0
  with:
    # Slack channel id, channel name, or user id to post message.
    # See also: https://api.slack.com/methods/chat.postMessage#channels
    channel-id: 'CHANNEL_ID'
    # For posting a rich message using Block Kit
    payload: |
      {
        "text": "GitHub Action build result: ${{ job.status }}\n${{ github.event.pull_request.html_url || github.event.head_commit.url }}",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "GitHub Action build result: ${{ job.status }}\n${{ github.event.pull_request.html_url || github.event.head_commit.url }}"
            }
          }
        ]
      }
  env:
    SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

#### Update the message

If you would like to notify the real-time updates on a build status, you can modify the message your build job posted in the subsequent steps. In order to do this, the steps after the first message posting can have `update-ts: ${{ steps.slack.outputs.ts }}` in their settings. With this, the step updates the already posted channel message instead of posting a new one.

Please note that **the message update step does not accept a channel name.** Set a channel ID for the steps for the actions that update messages.

```yaml
- id: slack
  uses: slackapi/slack-github-action@v1.24.0
  with:
    # The following message update step does not accept a channel name.
    # Setting a channel ID here for consistency is highly recommended.
    channel-id: "CHANNEL_ID"
    payload: |
      {
        "text": "Deployment started (In Progress)",
        "attachments": [
          {
            "pretext": "Deployment started",
            "color": "dbab09",
            "fields": [
              {
                "title": "Status",
                "short": true,
                "value": "In Progress"
              }
            ]
          }
        ]
      }
  env:
    SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN}}
- uses: slackapi/slack-github-action@v1.24.0
  with:
    # Unlike the step posting a new message, this step does not accept a channel name.
    # Please use a channel ID, not a name here.
    channel-id: "CHANNEL_ID"
    update-ts: ${{ steps.slack.outputs.ts }}
    payload: |
      {
        "text": "Deployment finished (Completed)",
        "attachments": [
          {
            "pretext": "Deployment finished",
            "color": "28a745",
            "fields": [
              {
                "title": "Status",
                "short": true,
                "value": "Completed"
              }
            ]
          }
        ]
      }
  env:
    SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN}}
```

### Technique 3: Slack Incoming Webhook

This approach allows your GitHub Actions job to post a message to a Slack channel or direct message by utilizing [Incoming Webhooks](https://api.slack.com/messaging/webhooks).

Incoming Webhooks conform to the same rules and functionality as any of Slack's other messaging APIs. You can make your posted messages as simple as a single line of text, or make them really useful with [interactive components](https://api.slack.com/messaging/interactivity). To make the message more expressive and useful use [Block Kit](https://api.slack.com/block-kit) to build and test visual components.

#### Setup

* [Create a Slack App][apps] for your workspace (alternatively use an existing app you have already created and installed).
* Add the [`incoming-webhook`](https://api.slack.com/scopes/incoming-webhook) bot scope under **OAuth & Permissions**.
* Install the app to your workspace (you will select a channel to notify).
* Activate and create a new webhook under **Incoming Webhooks**.
* Copy the Webhook URL from the Webhook you just generated [add it as a secret in your repo settings][repo-secret] named `SLACK_WEBHOOK_URL`.

#### Usage

```yaml
- name: Send custom JSON data to Slack workflow
  id: slack
  uses: slackapi/slack-github-action@v1.24.0
  with:
    # For posting a rich message using Block Kit
    payload: |
      {
        "text": "GitHub Action build result: ${{ job.status }}\n${{ github.event.pull_request.html_url || github.event.head_commit.url }}",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "GitHub Action build result: ${{ job.status }}\n${{ github.event.pull_request.html_url || github.event.head_commit.url }}"
            }
          }
        ]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
    SLACK_WEBHOOK_TYPE: INCOMING_WEBHOOK
```

### HTTPS Proxy

If you need to use a proxy to connect with Slack, you can use the `HTTPS_PROXY` (or `https_proxy`) environment variable. In this example we use the Slack App technique, but configuring a proxy works the same way for all of them:

```yaml
- name: Post to a Slack channel via a proxy
  id: slack
  uses: slackapi/slack-github-action@v1.24.0
  with:
    channel-id: 'CHANNEL_ID'
    slack-message: 'This message was sent through a proxy'
  env:
    SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
    # Set the HTTPS_PROXY environment variable to whatever your policy requires
    HTTPS_PROXY: 'http://proxy.example.org:8080'
```

## Contributing

See [CONTRIBUTING](.github/contributing.md).

## License

See [LICENSE](LICENSE).

[create-webhook]: https://slack.com/intl/en-ca/help/articles/360041352714-Create-more-advanced-workflows-using-webhooks
[job-step]: https://docs.github.com/en/actions/learn-github-actions/workflow-syntax-for-github-actions#jobsjob_idsteps
[repo-secret]: https://docs.github.com/en/free-pro-team@latest/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository
[apps]: https://api.slack.com/apps
