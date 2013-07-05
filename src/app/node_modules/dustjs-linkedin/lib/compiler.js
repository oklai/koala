var dustCompiler = (function(dust) {

dust.compile = function(source, name, strip) {
  try {
    if (strip) {
      source = source.replace(/^\s+/mg, '').replace(/\n/mg, '');
    }
    var ast = filterAST(dust.parse(source));
    return compile(ast, name);
  }
  catch(err)
  {
    if(!err.line || !err.column) throw err;    
    throw new SyntaxError(err.message + " At line : " + err.line + ", column : " + err.column);
  }
};

function filterAST(ast) {
  var context = {};
  return dust.filterNode(context, ast);
};

dust.filterNode = function(context, node) {
  return dust.optimizers[node[0]](context, node);
};

dust.optimizers = {
  body:      compactBuffers,
  buffer:    noop,
  special:   convertSpecial,
  format:    nullify,        // TODO: convert format
  reference: visit,
  "#":       visit,
  "?":       visit,
  "^":       visit,
  "<":       visit,
  "+":       visit,
  "@":       visit,
  "%":       visit,
  partial:   visit,
  context:   visit,
  params:    visit,
  bodies:    visit,
  param:     visit,
  filters:   noop,
  key:       noop,
  path:      noop,
  literal:   noop,
  comment:   nullify
};

dust.pragmas = {
  esc: function(compiler, context, bodies, params) {
    var old = compiler.auto;
    if (!context) context = 'h';
    compiler.auto = (context === 's') ? '' : context;
    var out = compileParts(compiler, bodies.block);
    compiler.auto = old;
    return out;
  }
};

function visit(context, node) {
  var out = [node[0]];
  for (var i=1, len=node.length; i<len; i++) {
    var res = dust.filterNode(context, node[i]);
    if (res) out.push(res);
  }
  return out;
};

// Compacts consecutive buffer nodes into a single node
function compactBuffers(context, node) {
  var out = [node[0]], memo;
  for (var i=1, len=node.length; i<len; i++) {
    var res = dust.filterNode(context, node[i]);
    if (res) {
      if (res[0] === 'buffer') {
        if (memo) {
          memo[1] += res[1];
        } else {
          memo = res;
          out.push(res);
        }
      } else {
        memo = null;
        out.push(res);
      }
    }
  }
  return out;
};

var specialChars = {
  "s": " ",
  "n": "\n",
  "r": "\r",
  "lb": "{",
  "rb": "}"
};

function convertSpecial(context, node) { return ['buffer', specialChars[node[1]]] };
function noop(context, node) { return node };
function nullify(){};

function compile(ast, name) {
  var context = {
    name: name,
    bodies: [],
    blocks: {},
    index: 0,
    auto: "h"
  }

  return "(function(){dust.register("
    + (name ? "\"" + name + "\"" : "null") + ","
    + dust.compileNode(context, ast)
    + ");"
    + compileBlocks(context)
    + compileBodies(context)
    + "return body_0;"
    + "})();";
};

function compileBlocks(context) {
  var out = [],
      blocks = context.blocks;

  for (var name in blocks) {
    out.push("'" + name + "':" + blocks[name]);
  }
  if (out.length) {
    context.blocks = "ctx=ctx.shiftBlocks(blocks);";
    return "var blocks={" + out.join(',') + "};";
  }
  return context.blocks = "";
};

function compileBodies(context) {
  var out = [],
      bodies = context.bodies,
      blx = context.blocks;

  for (var i=0, len=bodies.length; i<len; i++) {
    out[i] = "function body_" + i + "(chk,ctx){"
      + blx + "return chk" + bodies[i] + ";}";
  }
  return out.join('');
};

function compileParts(context, body) {
  var parts = '';
  for (var i=1, len=body.length; i<len; i++) {
    parts += dust.compileNode(context, body[i]);
  }
  return parts;
};

dust.compileNode = function(context, node) {
  return dust.nodes[node[0]](context, node);
};

dust.nodes = {
  body: function(context, node) {
    var id = context.index++, name = "body_" + id;
    context.bodies[id] = compileParts(context, node);
    return name;
  },

  buffer: function(context, node) {
    return ".write(" + escape(node[1]) + ")";
  },

  format: function(context, node) {
    return ".write(" + escape(node[1] + node[2]) + ")";
  },

  reference: function(context, node) {
    return ".reference(" + dust.compileNode(context, node[1])
      + ",ctx," + dust.compileNode(context, node[2]) + ")";
  },

  "#": function(context, node) {
    return compileSection(context, node, "section");
  },

  "?": function(context, node) {
    return compileSection(context, node, "exists");
  },

  "^": function(context, node) {
    return compileSection(context, node, "notexists");
  },

  "<": function(context, node) {
    var bodies = node[4];
    for (var i=1, len=bodies.length; i<len; i++) {
      var param = bodies[i],
          type = param[1][1];
      if (type === "block") {
        context.blocks[node[1].text] = dust.compileNode(context, param[2]);
        return '';
      }
    }
    return '';
  },

  "+": function(context, node) {
    if(typeof(node[1].text) === "undefined"  && typeof(node[4]) === "undefined"){
      return ".block(ctx.getBlock("
      + dust.compileNode(context, node[1])
      + ",chk, ctx)," + dust.compileNode(context, node[2]) + ", {},"
      + dust.compileNode(context, node[3])
      + ")";
    }else {
      return ".block(ctx.getBlock("
      + escape(node[1].text)
      + ")," + dust.compileNode(context, node[2]) + ","
      + dust.compileNode(context, node[4]) + ","
      + dust.compileNode(context, node[3])
      + ")";
    }
  },

  "@": function(context, node) {
    return ".helper("
      + escape(node[1].text)
      + "," + dust.compileNode(context, node[2]) + ","
      + dust.compileNode(context, node[4]) + ","
      + dust.compileNode(context, node[3])
      + ")";
  },

  "%": function(context, node) {
    // TODO: Move these hacks into pragma precompiler
    var name = node[1][1];
    if (!dust.pragmas[name]) return '';

    var rawBodies = node[4];
    var bodies = {};
    for (var i=1, len=rawBodies.length; i<len; i++) {
      var b = rawBodies[i];
      bodies[b[1][1]] = b[2];
    }

    var rawParams = node[3];
    var params = {};
    for (var i=1, len=rawParams.length; i<len; i++) {
      var p = rawParams[i];
      params[p[1][1]] = p[2][1];
    }

    var ctx = node[2][1] ? node[2][1].text : null;

    return dust.pragmas[name](context, ctx, bodies, params);
  },

  partial: function(context, node) {
    return ".partial("
      + dust.compileNode(context, node[1])
      + "," + dust.compileNode(context, node[2])
      + "," + dust.compileNode(context, node[3]) + ")";
  },

  context: function(context, node) {
    if (node[1]) {
      return "ctx.rebase(" + dust.compileNode(context, node[1]) + ")";
    }
    return "ctx";
  },

  params: function(context, node) {
    var out = [];
    for (var i=1, len=node.length; i<len; i++) {
      out.push(dust.compileNode(context, node[i]));
    }
    if (out.length) {
      return "{" + out.join(',') + "}";
    }
    return "null";
  },

  bodies: function(context, node) {
    var out = [];
    for (var i=1, len=node.length; i<len; i++) {
      out.push(dust.compileNode(context, node[i]));
    }
    return "{" + out.join(',') + "}";
  },

  param: function(context, node) {
    return dust.compileNode(context, node[1]) + ":" + dust.compileNode(context, node[2]);
  },

  filters: function(context, node) {
    var list = [];
    for (var i=1, len=node.length; i<len; i++) {
      var filter = node[i];
      list.push("\"" + filter + "\"");
    }
    return "\"" + context.auto + "\""
      + (list.length ? ",[" + list.join(',') + "]" : '');
  },

  key: function(context, node) {
    return "ctx.get(\"" + node[1] + "\")";
  },

  path: function(context, node) {
    var current = node[1],
        keys = node[2],
        list = [];

    for (var i=0,len=keys.length; i<len; i++) {
      if (dust.isArray(keys[i]))
        list.push(dust.compileNode(context, keys[i]));
      else
        list.push("\"" + keys[i] + "\"");
    }
    return "ctx.getPath(" + current + ",[" + list.join(',') + "])";
  },

  literal: function(context, node) {
    return escape(node[1]);
  }
};

function compileSection(context, node, cmd) {
  return "." + cmd + "("
    + dust.compileNode(context, node[1])
    + "," + dust.compileNode(context, node[2]) + ","
    + dust.compileNode(context, node[4]) + ","
    + dust.compileNode(context, node[3])
    + ")";
};

var escape = (typeof JSON === "undefined")
  ? function(str) { return "\"" + dust.escapeJs(str) + "\"" }
  : JSON.stringify;

  return dust;

});

if (typeof exports !== 'undefined') {
  module.exports = dustCompiler;
} else {
  dustCompiler(getGlobal());
}
