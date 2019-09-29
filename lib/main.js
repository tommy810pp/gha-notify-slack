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
            // const webhook_url = core.getInput('webhook_url');
            // const webhook = new IncomingWebhook(webhook_url);
            // await webhook.send(buildMessage(github, job))
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
// function buildMessage(github: any, job: any): any {
//   return {
//     attachments: [
//       {
//         pretext: toPretext(github, job),
//         color: toColor(job.status),
//         author_name: authorName(github, job),
//         title: '',
//         title_link: '',
//         text: '',
//         fields: [
//           {
//             title: 'Priority',
//             value: 'High',
//             short: false
//           }
//         ],
//         image_url: '',
//         footer: 'Github Actions',
//       }
//     ]
//   }
// }
// function authorName(github: any, job: any): String {
//   return github.workflow;
// }
// function toPretext(github: any, job: any): String {
//   return "";
// }
// function toColor(job_status: String): String {
//   switch(job_status) {
//     case 'Failure':
//       return 'danger';
//     case 'Success':
//       return 'good';
//     default:
//       return '#555555';
//   }
// }
run();
