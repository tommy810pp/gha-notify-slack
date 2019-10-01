import {GitHub} from '@actions/github';
import * as fs from 'fs';

import {HumanizeDuration, HumanizeDurationLanguage} from 'humanize-duration-ts';
const lang = new HumanizeDurationLanguage()
const humanDuration = new HumanizeDuration(lang);

export function factory(options) {
    const messageBuilder = messageBuilderFactory(options);
    messageBuilder.fieldsBuilder = fieldsBuilderFactory(options.fields_builder);
    return messageBuilder;
}

function messageBuilderFactory(options) {
    switch(options.github.event_name) {
      case 'pull_request':
        switch(options.github.event.action) {
          case 'rerequested':
            return new PullRequestRequestedMessageBuilder(options);
          case 'opened':
          case 'synchronize':
          case 'reopened':
            return new PullRequestMessageBuilder(options);
        }
      case 'push':
        return new PushMessageBuilder(options);
      case 'schedule':
        return new ScheduleMessageBuilder(options);
      case 'repository_dispatch':
        return new RepositoryDispatchMessageBuilder(options);
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
    
    fieldsBuilder?: FieldsBuilder;
    options: any;

    constructor(options) {
      this.options = options;
    }
    
    async build(): Promise<object>{
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
      return message;
    }
  
    async authorName(): Promise<string> {
      return "";
    }
  
    async pretext(): Promise<string> {
      return this.options.message;
    }
  
    async text(): Promise<string> {
      return "";
    }
  
    async color(): Promise<string> {
      switch(this.options.job.status) {
        case 'Failure':
          return 'danger';
        case 'Success':
          return 'good';
        default:
          return '#555555';
      }
    }
  
    async titleLink(): Promise<string> {
      return `https://github.com/${this.options.github.repository}/commit/${this.options.github.sha}/checks`;
    }
  
    async title(): Promise<string> {
      return this.options.github.workflow;
    }
  
    async fields() {
      if (this.fieldsBuilder === undefined) return [];
      return this.fieldsBuilder.build(this.options);
    }
  
    async footer(): Promise<string> {
      return this.options.footer;
    }
  
    async footerIcon(): Promise<string> {
      return this.options.footer_icon;
    }
  }
  
  class PushMessageBuilder extends MessageBuilder {
  }
  
  class PullRequestMessageBuilder extends MessageBuilder {
    async authorName(): Promise<string> {
      return this.options.github.repository;
    }
  
    async title(): Promise<string> {
      return this.options.github.event.pull_request.title;
    }
  
    async titleLink(): Promise<string> {
      return `${this.options.github.event.pull_request.html_url}/checks`;
    }
  
    async text(): Promise<string> {
      return this.options.github.event.pull_request.body;
    }
  }
  
  class PullRequestRequestedMessageBuilder extends MessageBuilder {
    gh_client: GitHub;
    pull_request: any;

    constructor(options) {
      super(options);
      this.gh_client = new GitHub(options.github_token);
    }
  
    async build() {
      this.pull_request = await this.fetchRepo();
      return super.build()
    }

    async fetchRepo() {
      const response = await this.gh_client.pulls.get({
        owner: this.options.github.event.repository.owner.login,
        pull_number: this.options.github.event.check_suite.pull_requests[0].number,
        repo: this.options.github.event.repository.name
      });
      console.log('pull_request', response.data);
      return response.data;
    }

    async authorName(): Promise<string> {
      return this.options.github.repository;
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
    async authorName(): Promise<string> {
      return "Periodically Integration Test";
    }
  }
  
  class RepositoryDispatchMessageBuilder extends MessageBuilder {
    async authorName(): Promise<string> {
      return `Triggered by ${this.options.github.actor}`;
    }
  }
  
  interface FieldsBuilder {
    build(options): [];
  }
  
  class DefaultFieldsBuilder implements FieldsBuilder {
    build(options): any {
      return [
        {
          title: 'Repository',
          value: options.github.repository,
          short: true
        },
        {
          title: 'Branch',
          value: options.github.ref,
          short: true
        }
      ]
    }
  }
  
  class KarateResultFiledsBuilder implements FieldsBuilder {
    build(options): any {
      const karateResultsFile = options.karate_results_file;
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
          "value": humanDuration.humanize(results.elapsedTime),
          "short": true
        },
        {
          "title": "totalTime",
          "value": humanDuration.humanize(Math.round(results.totalTime)),
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
  