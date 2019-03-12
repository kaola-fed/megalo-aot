const test = require('ava');
const path = require('path');
const render = require('../render');
const attachModuleToOptions = require('../../lib/frameworks/vue/utils/attachMultiPlatformModule.js');

let config = {
    target: 'wechat'
}

attachModuleToOptions(config)

test.serial('leave current platform template', t => {
    let result = render(resolve('simple.vue'), config);

	t.snapshot(result.body);
})

test.serial('remove other platform template', t => {
    let result = render(resolve('remove.vue'), config);

	t.snapshot(result.body);
})


function resolve (fileName) {
    return path.join(__dirname, './cases/multi-platform-template', fileName);
}