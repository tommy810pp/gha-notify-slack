import * as core from '@actions/core';
import {GitHub} from '@actions/github';
import {IncomingWebhook, IncomingWebhookSendArguments} from '@slack/webhook';
import { MessageAttachment } from '@slack/types';

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
      const message = await builder.build();
      console.log(message);
      const webhook = new IncomingWebhook(core.getInput('webhook_url'));
      await webhook.send(message);
    }
    
    // console.log(buildMessage(github, job, steps))
    
  } catch (error) {
    core.setFailed(error.message);
  }
}

function factory(github, job, steps) {
  switch(github.event_name) {
    case 'pull_request':
      switch(github.event.action) {
        case 'rerequested':
          return new PullRequestRequestedMessageBuilder(github, job, steps);
        case 'opened':
        case 'synchronize':
        case 'reopened':
          return new PullRequestMessageBuilder(github, job, steps);
      }
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
  
  async build(): Promise<IncomingWebhookSendArguments>{
    return {
      attachments: [{
        pretext: await this.pretext(),
        color: await this.color(),
        author_name: await this.authorName(),
        title: await this.title(),
        title_link: await this.titleLink(),
        text: await this.text(),
        fields: await this.fields(),
        footer: await this.footer(),
        footer_icon: await this.footerIcon(),
        ts: Date.now().toString()
      }]
    }
  }

  async authorName(): Promise<string> {
    return "";
  }

  async pretext(): Promise<string> {
    return core.getInput("message");
  }

  async text(): Promise<string> {
    return "";
  }

  async color(): Promise<string> {
    switch(this.job.status) {
      case 'Failure':
        return 'danger';
      case 'Success':
        return 'good';
      default:
        return '#555555';
    }
  }

  async titleLink(): Promise<string> {
    return `https://github.com/${this.github.repository}/commit/${this.github.sha}/checks`;
  }

  async title(): Promise<string> {
    return this.github.workflow;
  }

  async fields() {
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

  async footer(): Promise<string> {
    return core.getInput('footer');
  }

  async footerIcon(): Promise<string> {
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

  async authorName(): Promise<string> {
    return this.github.repository;
  }

  async title(): Promise<string> {
    return this.github.event.pull_request.title;
  }

  async titleLink(): Promise<string> {
    return `${this.github.event.pull_request.html_url}/checks`;
  }

  async text(): Promise<string> {
    return this.github.event.pull_request.body;
  }
  
  async fields() {
    return []
  }
}


class PullRequestRequestedMessageBuilder extends MessageBuilder {
  gh_client: GitHub;
  pull_request: any;
  constructor(github, job, steps) {
    super(github, job, steps);
    this.gh_client = new GitHub(core.getInput('github_token'));
  }

  async build() {
    const owner = this.github.event.repository.owner.login;
    const pull_number = this.github.event.check_suite.pull_requests[0].number;
    const repo = this.github.event.repository.name;
    this.pull_request = await this.gh_client.pulls.get({
      owner,
      pull_number,
      repo 
    });
    console.log(this.pull_request);
    return super.build()
  }

  async authorName(): Promise<string> {
    return this.github.repository;
  }

  async title(): Promise<string> {
    return this.pull_request.title;
  }

  async titleLink(): Promise<string> {
    return `${this.pull_request.html_url}/checks`;
  }

  async text(): Promise<string> {
    return this.pull_request.body;
  }
  
  async fields() {
    return []
  }
}

run();
