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
const fs_1 = require("fs");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const github = JSON.parse(core.getInput('github'));
            const job = JSON.parse(core.getInput('job'));
            const steps = JSON.parse(core.getInput('steps'));
            console.log(core.getInput('github'));
            console.log(core.getInput('job'));
            console.log(core.getInput('steps'));
            let builder = messageBuilderFactory(github, job, steps);
            builder.fieldsBuilder = fieldsBuilderFactory(core.getInput('fields_builder'));
            if (builder !== undefined) {
                const message = yield builder.build();
                console.log(message);
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
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            return {
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
                        ts: Date.now().toString()
                    }]
            };
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
            console.log(this.pull_request);
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
        this.results = JSON.parse(fs_1.readFileSync(core.getInput('karate_results_file'), { encoding: "utf-8" }));
    }
    build(github, job, steps) {
        let failures = [];
        this.results.failures.forEach((k, v) => {
            failures.push(`[${k}] ${v}`);
        });
        return [
            {
                "title": "features",
                "text": this.results.features,
                "short": true
            },
            {
                "title": "scenarios",
                "text": this.results.scenarios,
                "short": true
            },
            {
                "title": "passed",
                "text": this.results.passed,
                "short": true
            },
            {
                "title": "failed",
                "text": this.results.failed,
                "short": true
            },
            {
                "title": "elapsedTime",
                "text": this.results.elapsedTime,
                "short": true
            },
            {
                "title": "totalTime",
                "text": this.results.totalTime,
                "short": true
            },
            {
                "title": "failures",
                "text": failures.join('\n'),
                "short": false
            }
        ];
    }
}
run();
