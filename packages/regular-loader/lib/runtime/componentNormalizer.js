export default function(script, ast, scopedId) {
  var options = { scopedId: scopedId };
  var Regular = require('regularjs');

  script = script || {};

  if (script.__esModule) script = script["default"];
  if (Regular.__esModule) Regular = Regular["default"];

  var Ctor, components;
  if( typeof script === "object" ) {
    script.template = ast;
    Ctor = Regular.extend(script);
    components = script.components || script.component;
    if( typeof components === "object" ) {
      for( var i in components ) {
        Ctor.component(i, components[ i ]);
      }
    }
  } else if( typeof script === "function" && ( script.prototype instanceof Regular ) ) {
    script.prototype.template = ast;
    Ctor = script;
  }

  return {
    options: options,
    exports: Ctor
  }
}
