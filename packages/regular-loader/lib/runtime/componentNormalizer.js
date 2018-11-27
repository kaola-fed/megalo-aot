export default function(script, template, scopedId) {
  var options = { scopedId: scopedId };
  var Regular = require('regularjs');

  script = script || {};
  template = template || {};

  if (script.__esModule) script = script["default"];
  if (Regular.__esModule) Regular = Regular["default"];

  var Ctor, components;
  if( typeof script === "object" ) {
    if (template.template) {
      script.template = template.template || '';
    }
    if (template.expressions) {
      script.expressions = template.expressions;
    }
    Ctor = Regular.extend(script);
    components = script.components || script.component;
    if( typeof components === "object" ) {
      for( var i in components ) {
        Ctor.component(i, components[ i ]);
      }
    }
  } else if( typeof script === "function" && ( script.prototype instanceof Regular ) ) {
    if ( template.template ) {
      script.prototype.template = template.template;
    }
    if (template.expressions) {
      script.prototype.expressions = template.expressions;
    }
    Ctor = script;
  }

  return {
    options: options,
    exports: Ctor
  }
}
