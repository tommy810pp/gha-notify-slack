import * as core from '@actions/core';
import { factory } from './message';
import {IncomingWebhook} from '@slack/webhook';

async function run() {
  try {
    const options = {
      github: JSON.parse(core.getInput('github')),
      job: JSON.parse(core.getInput('job')),
      steps: JSON.parse(core.getInput('steps')),
      footer: core.getInput('footer'),
      footer_icon: core.getInput('footer_icon'),
      fields_builder: core.getInput('fields_builder'),
      karate_results_file: core.getInput('karate_results_file'),
      webhook_url: core.getInput('webhook_url'),
      github_token: core.getInput('github_token')
    };
    
    console.log(options);
    
    let builder = factory(options);
    if (builder !== undefined) {
      const message = await builder.build();
      console.log('message', message);
      await new IncomingWebhook(options.webhook_url).send(message);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
