"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github_1 = require("@actions/github");
const webhook_1 = require("@slack/webhook");
const fs = __importStar(require("fs"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const github = JSON.parse(core.getInput('github'));
            const job = JSON.parse(core.getInput('job'));
            const steps = JSON.parse(core.getInput('steps'));
            let builder = messageBuilderFactory(github, job, steps);
            builder.fieldsBuilder = fieldsBuilderFactory(core.getInput('fields_builder'));
            if (builder !== undefined) {
                const message = yield builder.build();
                const webhook = new webhook_1.IncomingWebhook(core.getInput('webhook_url'));
                yield webhook.send(message);
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
function messageBuilderFactory(github, job, steps) {
    switch (github.event_name) {
        case 'pull_request':
            switch (github.event.action) {
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
    switch (type) {
        case 'karate':
            return new KarateResultFiledsBuilder();
        default:
            return new DefaultFieldsBuilder();
    }
}
class MessageBuilder {
    constructor(github, job, steps) {
        this.github = github;
        this.job = job;
        this.steps = steps;
        console.log('github', JSON.stringify(core.getInput('github')));
        console.log('job', JSON.stringify(core.getInput('job')));
        console.log('steps', JSON.stringify(core.getInput('steps')));
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            const message = {
                attachments: [{
                        pretext: yield this.pretext(),
                        color: yield this.color(),
                        author_name: yield this.authorName(),
                        title: yield this.title(),
                        title_link: yield this.titleLink(),
                        text: yield this.text(),
                        fields: yield this.fields(),
                        footer: yield this.footer(),
                        footer_icon: yield this.footerIcon(),
                        ts: (Date.now() / 1000).toString()
                    }]
            };
            console.log('built message', JSON.stringify(message));
            return message;
        });
    }
    authorName() {
        return __awaiter(this, void 0, void 0, function* () {
            return "";
        });
    }
    pretext() {
        return __awaiter(this, void 0, void 0, function* () {
            return core.getInput("message");
        });
    }
    text() {
        return __awaiter(this, void 0, void 0, function* () {
            return "";
        });
    }
    color() {
        return __awaiter(this, void 0, void 0, function* () {
            switch (this.job.status) {
                case 'Failure':
                    return 'danger';
                case 'Success':
                    return 'good';
                default:
                    return '#555555';
            }
        });
    }
    titleLink() {
        return __awaiter(this, void 0, void 0, function* () {
            return `https://github.com/${this.github.repository}/commit/${this.github.sha}/checks`;
        });
    }
    title() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.github.workflow;
        });
    }
    fields() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.fieldsBuilder === undefined)
                return [];
            return this.fieldsBuilder.build(this.github, this.job, this.steps);
        });
    }
    footer() {
        return __awaiter(this, void 0, void 0, function* () {
            return core.getInput('footer');
        });
    }
    footerIcon() {
        return __awaiter(this, void 0, void 0, function* () {
            return core.getInput('footer_icon');
        });
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
    authorName() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.github.repository;
        });
    }
    title() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.github.event.pull_request.title;
        });
    }
    titleLink() {
        return __awaiter(this, void 0, void 0, function* () {
            return `${this.github.event.pull_request.html_url}/checks`;
        });
    }
    text() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.github.event.pull_request.body;
        });
    }
}
class PullRequestRequestedMessageBuilder extends MessageBuilder {
    constructor(github, job, steps) {
        super(github, job, steps);
        this.gh_client = new github_1.GitHub(core.getInput('github_token'));
    }
    build() {
        const _super = Object.create(null, {
            build: { get: () => super.build }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const owner = this.github.event.repository.owner.login;
            const pull_number = this.github.event.check_suite.pull_requests[0].number;
            const repo = this.github.event.repository.name;
            const response = yield this.gh_client.pulls.get({
                owner,
                pull_number,
                repo
            });
            this.pull_request = response.data;
            console.log('pull_request', this.pull_request);
            return _super.build.call(this);
        });
    }
    authorName() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.github.repository;
        });
    }
    title() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.pull_request.title;
        });
    }
    titleLink() {
        return __awaiter(this, void 0, void 0, function* () {
            return `${this.pull_request.html_url}/checks`;
        });
    }
    text() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.pull_request.body;
        });
    }
}
class ScheduleMessageBuilder extends MessageBuilder {
    constructor(github, job, steps) {
        super(github, job, steps);
    }
    authorName() {
        return __awaiter(this, void 0, void 0, function* () {
            return "Periodically Integration Test";
        });
    }
}
class RepositoryDispatchMessageBuilder extends MessageBuilder {
    constructor(github, job, steps) {
        super(github, job, steps);
    }
    authorName() {
        return __awaiter(this, void 0, void 0, function* () {
            return `Triggered by ${this.github.actor}`;
        });
    }
}
class DefaultFieldsBuilder {
    constructor() {
    }
    build(github, job, steps) {
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
        ];
    }
}
class KarateResultFiledsBuilder {
    constructor() {
    }
    build(github, job, steps) {
        const karateResultsFile = core.getInput('karate_results_file');
        if (!karateResultsFile)
            return [];
        if (!fs.existsSync(karateResultsFile))
            return [];
        const results = JSON.parse(fs.readFileSync(karateResultsFile, { encoding: "utf-8" }));
        if (!results)
            return [];
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
            let failures = [];
            for (const key in results.failures) {
                failures.push(key);
                results.failures[key].split('\n').forEach(line => {
                    failures.push(`    ${line}`);
                });
            }
            fields.push({
                "title": "failures",
                "value": failures.join('\n'),
                "short": false
            });
        }
        return fields;
    }
}
run();
