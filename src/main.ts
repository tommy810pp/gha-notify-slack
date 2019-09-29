import * as core from '@actions/core';

async function run() {
  try {
    const github = JSON.parse(core.getInput('github'));
    const job = JSON.parse(core.getInput('job'));
    const steps = JSON.parse(core.getInput('steps'));
    console.log(github);
    console.log(job);
    console.log(steps);
    // const webhook_url = core.getInput('webhook_url');
    // const webhook = new IncomingWebhook(webhook_url);
    // await webhook.send(buildMessage(github, job))
  } catch (error) {
    core.setFailed(error.message);
  }
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
