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
const github_1 = require("@actions/github");
const fs = __importStar(require("fs"));
const humanize_duration_ts_1 = require("humanize-duration-ts");
const lang = new humanize_duration_ts_1.HumanizeDurationLanguage();
const humanDuration = new humanize_duration_ts_1.HumanizeDuration(lang);
function factory(options) {
    const messageBuilder = messageBuilderFactory(options);
    messageBuilder.fieldsBuilder = fieldsBuilderFactory(options.fields_builder);
    return messageBuilder;
}
exports.factory = factory;
function messageBuilderFactory(options) {
    switch (options.github.event_name) {
        case 'pull_request':
            switch (options.github.event.action) {
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
    switch (type) {
        case 'karate':
            return new KarateResultFiledsBuilder();
        default:
            return new DefaultFieldsBuilder();
    }
}
class MessageBuilder {
    constructor(options) {
        this.options = options;
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
            return this.options.message;
        });
    }
    text() {
        return __awaiter(this, void 0, void 0, function* () {
            return "";
        });
    }
    color() {
        return __awaiter(this, void 0, void 0, function* () {
            switch (this.options.job.status) {
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
            return `https://github.com/${this.options.github.repository}/commit/${this.options.github.sha}/checks`;
        });
    }
    title() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.options.github.workflow;
        });
    }
    fields() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.fieldsBuilder === undefined)
                return [];
            return this.fieldsBuilder.build(this.options);
        });
    }
    footer() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.options.footer;
        });
    }
    footerIcon() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.options.footer_icon;
        });
    }
}
class PushMessageBuilder extends MessageBuilder {
}
class PullRequestMessageBuilder extends MessageBuilder {
    authorName() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.options.github.repository;
        });
    }
    title() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.options.github.event.pull_request.title;
        });
    }
    titleLink() {
        return __awaiter(this, void 0, void 0, function* () {
            return `${this.options.github.event.pull_request.html_url}/checks`;
        });
    }
    text() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.options.github.event.pull_request.body;
        });
    }
}
class PullRequestRequestedMessageBuilder extends MessageBuilder {
    constructor(options) {
        super(options);
        this.gh_client = new github_1.GitHub(options.github_token);
    }
    build() {
        const _super = Object.create(null, {
            build: { get: () => super.build }
        });
        return __awaiter(this, void 0, void 0, function* () {
            this.pull_request = yield this.fetchRepo();
            return _super.build.call(this);
        });
    }
    fetchRepo() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.gh_client.pulls.get({
                owner: this.options.github.event.repository.owner.login,
                pull_number: this.options.github.event.check_suite.pull_requests[0].number,
                repo: this.options.github.event.repository.name
            });
            console.log('pull_request', response.data);
            return response.data;
        });
    }
    authorName() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.options.github.repository;
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
    authorName() {
        return __awaiter(this, void 0, void 0, function* () {
            return "Periodically Integration Test";
        });
    }
}
class RepositoryDispatchMessageBuilder extends MessageBuilder {
    authorName() {
        return __awaiter(this, void 0, void 0, function* () {
            return `Triggered by ${this.options.github.actor}`;
        });
    }
}
class DefaultFieldsBuilder {
    build(options) {
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
        ];
    }
}
class KarateResultFiledsBuilder {
    build(options) {
        const karateResultsFile = options.karate_results_file;
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
                "value": humanDuration.humanize(results.elapsedTime),
                "short": true
            },
            {
                "title": "totalTime",
                "value": humanDuration.humanize(results.totalTime),
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
