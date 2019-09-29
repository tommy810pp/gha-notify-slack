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
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const github = JSON.parse(core.getInput('github'));
            const job = JSON.parse(core.getInput('job'));
            const steps = JSON.parse(core.getInput('steps'));
            console.log(core.getInput('github'));
            console.log(core.getInput('job'));
            console.log(core.getInput('steps'));
            const builder = factory(github, job, steps);
            if (builder !== undefined) {
                const message = builder.build();
                console.log(message);
            }
            // console.log(buildMessage(github, job, steps))
            // const webhook_url = core.getInput('webhook_url');
            // const webhook = new IncomingWebhook(webhook_url);
            // await webhook.send(buildMessage(github, job))
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
function factory(github, job, steps) {
    switch (github.event_name) {
        case 'pull_request':
            return new PullRequestMessageBuilder(github, job, steps);
        case 'push':
            return new PushMessageBuilder(github, job, steps);
    }
}
class MessageBuilder {
    constructor(github, job, steps) {
        this.github = github;
        this.job = job;
        this.steps = steps;
    }
    build() {
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
        };
    }
    authorName() {
        return "";
    }
    pretext() {
        return core.getInput("message");
    }
    text() {
        return "";
    }
    color() {
        switch (this.job.status) {
            case 'Failure':
                return 'danger';
            case 'Success':
                return 'good';
            default:
                return '#555555';
        }
    }
    titleLink() {
        return `https://github.com/${this.github.repository}/commit/${this.github.sha}/checks`;
    }
    title() {
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
        ];
    }
    footer() {
        return core.getInput('footer');
    }
    footerIcon() {
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
    authorName() {
        return this.github.repository;
    }
    title() {
        return this.github.event.pull_request.title;
    }
    titleLink() {
        return `${this.github.event.pull_request.html_url}/checks`;
    }
    text() {
        return this.github.event.pull_request.body;
    }
    fields() {
        return [];
    }
}
run();
