const compiler = require('vue-template-compiler')

/* this function use vue-template-compiler to parse and get block,
which defines block like the following:

declare type SFCDescriptor = {
    template: ?SFCBlock;
    script: ?SFCBlock;
    styles: Array<SFCBlock>;
    customBlocks: Array<SFCBlock>;
    errors: Array<string | WarningMessage>;
}

declare type SFCBlock = {
    type: string;
    content: string;
    attrs: {[attribute:string]: string};
    start?: number;
    end?: number;
    lang?: string;
    src?: string;
    scoped?: boolean;
    module?: string | boolean;
}; */

/**
 * get the specified block content from the given vue file source
 *
 * @param {string} source
 * @param {string} blockType
 * @returns {SFCBlock[]}
 */
function getBlocksByType (source, blockType) {
    const descriptor = compiler.parseComponent(source), block = null;
    const types = ['template', 'script'];
    
    if (types.indexOf(blockType) != -1) {
        return [descriptor[blockType]];
    }

    if (blockType == 'style' || blockType == 'styles') {
        return descriptor.styles;
    }

    let customBlocks = descriptor.customBlocks;
    
    return customBlocks.filter((block) => {
        return block.type === blockType;
    });
}

module.exports = getBlocksByType;