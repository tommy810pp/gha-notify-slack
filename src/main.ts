import * as core from '@actions/core';

async function run() {
  try {
    const github = JSON.parse(core.getInput('github'));
    const job = JSON.parse(core.getInput('job'));
    const steps = JSON.parse(core.getInput('steps'));
    console.log(core.getInput('github'));
    console.log(core.getInput('job'));
    console.log(core.getInput('steps'));
    console.log(buildMessage(github, job, steps))
    // const webhook_url = core.getInput('webhook_url');
    // const webhook = new IncomingWebhook(webhook_url);
    // await webhook.send(buildMessage(github, job))
  } catch (error) {
    core.setFailed(error.message);
  }
}

function buildMessage(github: any, job: any, steps: any): any {
  return {
    attachments: [
      {
        pretext: buildPretext(github, job),
        color: buildColor(job.status),
        author_name: buildAuthorName(github, job),
        title: buildTitle(github, job),
        title_link: buildTitleLink(github, job),
        text: buildText(github, job),
        fields: buildFields(github, job),
        image_url: '',
        footer: 'Github Actions',
        footer_icon: '',
        ts: Date.now()
      }
    ]
  }
}

function buildAuthorName(github: any, job: any): String {
  return github.workflow;
}

function buildPretext(github: any, job: any): String {
  return "";
}

function buildText(github: any, job: any): String {
  return "";
}

function buildColor(job_status: String): String {
  switch(job_status) {
    case 'Failure':
      return 'danger';
    case 'Success':
      return 'good';
    default:
      return '#555555';
  }
}

function buildTitleLink(github: any, job: any): String {
  console.log(github.event.check_suite.pull_requests)
  if (github.event.check_suite.pull_requests.length > 0) {
    const pr = github.event.check_suite.pull_requests[0];
    return `https://github.com/Pay-Baymax/payment-test/pull/${pr.number}/checks?sha=${pr.head.sha}`;
  }
  else {
    return `https://github.com/Pay-Baymax/payment-test/commit/${github.sha}/checks`
  }
}

function buildTitle(github: any, job: any): String {
  return `${github.workflow} ${job.status}`;
}

function buildFields(github: any, job: any) {
  return [
    {
      title: 'Repository',
      value: github.repository,
      short: true
    },
    {
      title: 'Branch',
      value: github.ref,
      short: true
    },
    {
      title: 'Message',
      value: github.event.check_suite.head_commit.message
    }
  ]
}
run();
