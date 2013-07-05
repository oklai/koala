var parser = require('uglify-js').parser,
    uglifier = require ("uglify-js").uglify,
    fs   = require('fs'),
    path = require('path'),
    root = path.join(path.dirname(__filename), "..");

var orig_code = fs.readFileSync(path.join(root, process.argv[2]), 'utf8');
    
var ast=parser.parse(orig_code);

ast = uglifier.ast_mangle(ast, {
    except: ["require", "define"]
  }); 
ast = uglifier.ast_squeeze(ast);

var final_code = uglifier.gen_code(ast);
    
fs.writeFileSync(path.join(root, process.argv[3]),final_code);