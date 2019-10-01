import {factory} from '../src/message';
import {readFileSync} from 'fs';
// shows how the runner will run a javascript action with env / stdout protocol
test('pull_request, opened', () => {
    // const message = factory(JSON.parse(readFileSync('./testdata/pull_request/opened/input.json', 'utf8'))).build()
    // console.log(message);
});
test('pull_request, synchonized', () => {
    // const message = factory(JSON.parse(readFileSync('./testdata/pull_request/synchonized/input.json', 'utf8'))).build()
    // console.log(message);
});
test('pull_request, reopened', () => {
    // const message = factory(JSON.parse(readFileSync('./testdata/pull_request/reopened/input.json', 'utf8'))).build()
    // console.log(message);
});
test('pull_request, retry', () => {
    // const message = factory(JSON.parse(readFileSync('./testdata/pull_request/retry/input.json', 'utf8'))).build()
    // console.log(message);
});
test('push', () => {
    // const message = factory(JSON.parse(readFileSync('./testdata/push/input.json', 'utf8'))).build()
    // console.log(message);
});
test('repository_dispatch', () => {
    // const message = factory(JSON.parse(readFileSync('./testdata/repository_dispatch/input.json', 'utf8'))).build()
    // console.log(message);
});