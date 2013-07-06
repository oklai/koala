var path   = require('path'),
    fs     = require('fs'),
    Script = process.binding('evals').Script,
    dust   = require('../lib/dust'),
    root   = path.join(path.dirname(__filename), "..");

var src = fs.readFileSync(path.join(root, 'docs/index.dust.html'), 'utf8');
dust.loadSource(dust.compile(src, "index"));

var sd = process.compile(fs.readFileSync(path.join(root, 'vendor/showdown.js'), 'utf8'), 'showdown.js');

var inliners = {
  css: function(names) {
    var out = "<style type=\"text/css\">";
    names.forEach(function(name) {
      out += fs.readFileSync(path.join(root, 'docs', name + '.css'), 'utf8');
    });
    out += "</style>";
    return out;
  },

  js: function(names) {
    var out = "<script type=\"text/javascript\">";
    names.forEach(function(name) {
      out += fs.readFileSync(path.join(root, 'docs', name + '.js'), 'utf8');
    });
    out += "</script>";
    return out;
  }
}

var context = {
  inline: function(chk, ctx, bod, prm) {
    var names = prm.names.split(' ');
    return chk.write(inliners[prm.ext](names));
  },

  tmpl: function(chk, ctx, bod, prm) {
    var names = prm.names.split(' ');
    var out = "<script type=\"text/javascript\">";
    names.forEach(function(name) {
      out += dust.compile(fs.readFileSync(path.join(root, 'docs', name + '.dust.html'), 'utf8'), "select");
    });
    out += "</script>";
    return chk.write(out);
  },

  md: function(chk, ctx, bod, prm) {
    var converter = new sd();
    return chk.tap(function(data) {
      return converter.makeHtml(data);
    }).render(bod.block, ctx).untap();
  },

  file: function(chk, ctx, bod, prm) {
    var name = prm.name;
    return chk.write(fs.readFileSync(path.join(root, 'docs', name), 'utf8'));
  }
}

function render() {
  dust.render("index", context, function(err, output) {
    if (err) throw err;
    fs.writeFileSync(path.join(root, 'index.html'), output);
  });
}

render();