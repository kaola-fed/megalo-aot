const postcss = require('postcss');
const parser = require('postcss-selector-parser');

module.exports = postcss.plugin('postcss-transform-tag', function (opts) {
  opts = opts || {};

  return function (root, result) {
    root.walkRules((rule) => {
      const selector = parser(selectors => {
        selectors.walkTags(tag => {
          tag.value = `._${tag.value}`
        })
      }).processSync(rule.selector)

      rule.selector = selector
    });
  };
});