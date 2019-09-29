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
            console.log(buildMessage(github, job, steps));
            // const webhook_url = core.getInput('webhook_url');
            // const webhook = new IncomingWebhook(webhook_url);
            // await webhook.send(buildMessage(github, job))
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
function buildMessage(github, job, steps) {
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
    };
}
function buildAuthorName(github, job) {
    return github.workflow;
}
function buildPretext(github, job) {
    return "";
}
function buildText(github, job) {
    return "";
}
function buildColor(job_status) {
    switch (job_status) {
        case 'Failure':
            return 'danger';
        case 'Success':
            return 'good';
        default:
            return '#555555';
    }
}
function buildTitleLink(github, job) {
    console.log(github.event.check_suite.pull_requests);
    if (github.event.check_suite.pull_requests.length > 0) {
        const pr = github.event.check_suite.pull_requests[0];
        return `https://github.com/Pay-Baymax/payment-test/pull/${pr.number}/checks?sha=${pr.head.sha}`;
    }
    else {
        return `https://github.com/Pay-Baymax/payment-test/commit/${github.sha}/checks`;
    }
}
function buildTitle(github, job) {
    return `${github.workflow} ${job.status}`;
}
function buildFields(github, job) {
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
    ];
}
run();
