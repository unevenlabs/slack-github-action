const github = require('@actions/github');
const flatten = require('flat');
const axios = require('axios');
const path = require('path');
const markup = require('markup-js');

const { createWebClient } = require('./web-client');

const authors = {
  d3or: {
    id: 'U04S33SE7G8',
    name: 'Deor',
  },
  'devops-unevenlabs': {
    id: 'U04NS0VMWNN',
    name: 'Filipe',
  },
  fdmota: {
    id: 'U04NS0VMWNN',
    name: 'Filipe',
  },
  georgeroman: {
    id: 'U03MA663BA6',
    name: 'Goerge',
  },
  ipeleg: {
    id: 'U03MCJ37NLU',
    name: 'Idan',
  },
  nofir: {
    id: 'U03M3HRPV70',
    name: 'Ofir',
  },
  tv3636: {
    id: 'U04H7HTDEH1',
    name: 'Tom',
  },
}

const status = {
  failure: ':boom:',
  success: ':rocket:',
}

module.exports = async function slackSend(core) {
  try {
    const botToken = process.env.SLACK_BOT_TOKEN;

    if ((botToken === undefined || botToken.length <= 0)) {
      throw new Error('Need to provide at least one botToken');
    }

    let payload = core.getInput('payload');

    let webResponse;

    const notify_user = payload.search('<status-success-status>') === -1;
    if (payload) {
      for (const s in status) {
        payload = payload.replaceAll(`<status-${s}-status>`, status[s]);
      }
      for (const a in authors) {
        if (notify_user) {
          payload = payload.replaceAll(`<author-${a}-author>`, `<@${authors[a].id}>`);
        } else {
          payload = payload.replaceAll(`<author-${a}-author>`, `${authors[a].name}`);
        }
      }
      try {
        // confirm it is valid json
        payload = JSON.parse(payload);
      } catch (e) {
        // passed in payload wasn't valid json
        console.log(payload)
        console.error('passed in payload was invalid JSON');
        throw new Error('Need to provide valid JSON payload');
      }
    }

    if (typeof botToken !== 'undefined' && botToken.length > 0) {
      const message = core.getInput('slack-message') || '';
      const channelIds = core.getInput('channel-id') || 'ci';
      const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy || '';
      const web = createWebClient(botToken, httpsProxy);

      if (channelIds.length <= 0) {
        console.log('Channel ID is required to run this action. An empty one has been provided');
        throw new Error('Channel ID is required to run this action. An empty one has been provided');
      }

      if (message.length > 0 || payload) {
        const ts = core.getInput('update-ts');
        await Promise.all(channelIds.split(',').map(async (channelId) => {
          if (ts) {
            // update message
            webResponse = await web.chat.update({ ts, channel: channelId.trim(), text: message, ...(payload || {}) });
          } else {
            // post message
            webResponse = await web.chat.postMessage({ channel: channelId.trim(), text: message, ...(payload || {}) });
          }
        }));
      } else {
        console.log('Missing slack-message or payload! Did not send a message via chat.postMessage with botToken', { channel: channelIds, text: message, ...(payload) });
        throw new Error('Missing message content, please input a valid payload or message to send. No Message has been send.');
      }
    }

    if (webResponse && webResponse.ok) {
      core.setOutput('ts', webResponse.ts);
      // return the thread_ts if it exists, if not return the ts
      const thread_ts = webResponse.thread_ts ? webResponse.thread_ts : webResponse.ts;
      core.setOutput('thread_ts', thread_ts);
      // return id of the channel from the response
      core.setOutput('channel_id', webResponse.channel);
    }

    const time = (new Date()).toTimeString();
    core.setOutput('time', time);
  } catch (error) {
    core.setFailed(error);
  }
};
