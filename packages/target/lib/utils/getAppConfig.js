// 1. search app.js for config
// 2. search App.js for config
const path = require('path');
const fs = require('fs')
const extractConfigPlugin = require('../babel-plugins/extract-config');
const { babel } = require('./babel')

function getAppConfig() {
    const root = process.cwd();
    const jsFile = path.join(root, 'src/app.js');
    const vueFile = path.join(root, 'src/App.vue');
    let config = null

    if (fs.existsSync(jsFile)) {
        let source = fs.readFileSync(jsFile, { encoding: 'utf8' });

        const babelOptions = {
            filename: jsFile,
            plugins: [
                extractConfigPlugin
            ]
        }

        const { metadata } = babel.transform(source, babelOptions)
        
        config = metadata.megaloConfig && metadata.megaloConfig.value;
    }
    
    if (config || (!config && !fs.existsSync(vueFile))) {
        return config || {};
    }

    const getBlockContent = require('./getBlockContent');
    const content = fs.readFileSync(vueFile, { encoding: 'utf8' });
    let blocks = getBlockContent(content, 'config')

    if (!blocks.length) {
        return {};
    }

    return parseConfig({ source: blocks[0].content, lang: blocks[0].lang || 'json', filepath: vueFile });
}

module.exports = getAppConfig;
