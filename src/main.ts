import * as core from '@actions/core';

async function run() {
  try {
    const github = JSON.parse(core.getInput('github'));
    const job = JSON.parse(core.getInput('job'));
    const steps = JSON.parse(core.getInput('steps'));
    console.log(core.getInput('github'));
    console.log(core.getInput('job'));
    console.log(core.getInput('steps'));
    
    const builder = factory(github, job, steps)
    if (builder !== undefined) {
      const message = builder.build();
      console.log(message);
    }
    // console.log(buildMessage(github, job, steps))
    // const webhook_url = core.getInput('webhook_url');
    // const webhook = new IncomingWebhook(webhook_url);
    // await webhook.send(buildMessage(github, job))
  } catch (error) {
    core.setFailed(error.message);
  }
}

function factory(github, job, steps) {
  switch(github.event_name) {
    case 'pull_request':
      return new PullRequestMessageBuilder(github, job, steps);
    case 'push':
      return new PushMessageBuilder(github, job, steps);
  }
}

class MessageBuilder {
  github: any;
  job: any;
  steps: any;
  constructor(github, job, steps) {
    this.github = github;
    this.job = job;
    this.steps = steps;
  }
  
  build(): any {
    return {
      attachments: [
        {
          pretext: this.pretext(),
          color: this.color(),
          author_name: this.authorName(),
          title: this.title(),
          title_link: this.titleLink(),
          text: this.text(),
          fields: this.fields(),
          footer: this.footer(),
          footer_icon: this.footerIcon(),
          ts: Date.now()
        }
      ]
    }
  }

  authorName(): String {
    return "";
  }

  pretext(): String {
    return core.getInput("message");
  }

  text(): String {
    return "";
  }

  color(): String {
    switch(this.job.status) {
      case 'Failure':
        return 'danger';
      case 'Success':
        return 'good';
      default:
        return '#555555';
    }
  }

  titleLink(): String {
    return `https://github.com/${this.github.repository}/commit/${this.github.sha}/checks`;
  }

  title(): String {
    return this.github.workflow;
  }

  fields() {
    return [
      {
        title: 'Repository',
        value: this.github.repository,
        short: true
      },
      {
        title: 'Branch',
        value: this.github.ref,
        short: true
      }
    ]
  }

  footer(): String {
    return core.getInput('footer');
  }

  footerIcon(): String {
    return core.getInput('footer_icon');
  }
}

class PushMessageBuilder extends MessageBuilder {
  constructor(github, job, steps) {
    super(github, job, steps);
  }
}

class PullRequestMessageBuilder extends MessageBuilder {
  constructor(github, job, steps) {
    super(github, job, steps);
  }

  authorName(): String {
    return this.github.repository;
  }

  title(): String {
    return this.github.event.pull_request.title;
  }

  titleLink(): String {
    return `${this.github.event.pull_request.html_url}/checks`;
  }

  text(): String {
    return this.github.event.pull_request.body;
  }
  
  fields(): any {
    return []
  }
}

run();
