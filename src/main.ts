import * as core from '@actions/core';
import {GitHub} from '@actions/github';
import {IncomingWebhook, IncomingWebhookSendArguments} from '@slack/webhook';
import * as fs from 'fs';

async function run() {
  try {
    const github = JSON.parse(core.getInput('github'));
    const job = JSON.parse(core.getInput('job'));
    const steps = JSON.parse(core.getInput('steps'));
    
    let builder = messageBuilderFactory(github, job, steps);
    builder.fieldsBuilder = fieldsBuilderFactory(core.getInput('fields_builder'));
    if (builder !== undefined) {
      const message = await builder.build();
      const webhook = new IncomingWebhook(core.getInput('webhook_url'));
      await webhook.send(message);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

function messageBuilderFactory(github, job, steps) {
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
    case 'schedule':
      return new ScheduleMessageBuilder(github, job, steps);
    case 'repository_dispatch':
      return new RepositoryDispatchMessageBuilder(github, job, steps);
    default:
      throw new Error("not supported event type");
  }
}

function fieldsBuilderFactory(type) {
  switch(type) {
    case 'karate':
      return new KarateResultFiledsBuilder();
    default:
      return new DefaultFieldsBuilder();
  }
}

class MessageBuilder {
  github: any;
  job: any;
  steps: any;
  fieldsBuilder?: FieldsBuilder;

  constructor(github, job, steps) {
    this.github = github;
    this.job = job;
    this.steps = steps;

    console.log('github', JSON.stringify(core.getInput('github')));
    console.log('job', JSON.stringify(core.getInput('job')));
    console.log('steps', JSON.stringify(core.getInput('steps')));
  }
  
  async build(): Promise<IncomingWebhookSendArguments>{

    const message = {
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
        ts: (Date.now()/1000).toString()
      }]
    };

    console.log('built message', JSON.stringify(message));

    return message;
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
    if (this.fieldsBuilder === undefined) return [];
    return this.fieldsBuilder.build(this.github, this.job, this.steps);
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
    const response = await this.gh_client.pulls.get({
      owner,
      pull_number,
      repo 
    });
    this.pull_request = response.data;
    console.log('pull_request', this.pull_request);
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
}

class ScheduleMessageBuilder extends MessageBuilder {
  constructor(github, job, steps) {
    super(github, job, steps);
  }
  async authorName(): Promise<string> {
    return "Periodically Integration Test";
  }
}

class RepositoryDispatchMessageBuilder extends MessageBuilder {
  constructor(github, job, steps) {
    super(github, job, steps);
  }
  async authorName(): Promise<string> {
    return `Triggered by ${this.github.actor}`;
  }
}

interface FieldsBuilder {
  build(github, job, steps): [];
}

class DefaultFieldsBuilder implements FieldsBuilder {
  constructor() {
  }

  build(github, job, steps): any {
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
      }
    ]
  }
}

class KarateResultFiledsBuilder implements FieldsBuilder {
  constructor() {
  }

  build(github, job, steps): any {
    const karateResultsFile = core.getInput('karate_results_file');
    if (!karateResultsFile) return [];
    if (!fs.existsSync(karateResultsFile)) return [];
    const results = JSON.parse(fs.readFileSync(karateResultsFile, {encoding: "utf-8"}));
    if (!results) return [];
    const fields = [
      {
        "title": "features",
        "value": results.features,
        "short": true
      },
      {
        "title": "scenarios",
        "value": results.scenarios,
        "short": true
      },
      {
        "title": "passed",
        "value": results.passed,
        "short": true
      },
      {
        "title": "failed",
        "value": results.failed,
        "short": true
      },
      {
        "title": "elapsedTime",
        "value": results.elapsedTime,
        "short": true
      },
      {
        "title": "totalTime",
        "value": results.totalTime,
        "short": true
      }
    ];

    if (results.failures) {
      let failures: string[] = [];
      for(const key in results.failures) {
        failures.push(key);
        results.failures[key].split('\n').forEach(line => {
          failures.push(`    ${line}`);
        });
      }
      fields.push(
        {
          "title": "failures",
          "value": failures.join('\n'),
          "short": false
        })
    }
    return fields;
  }
}

run();
