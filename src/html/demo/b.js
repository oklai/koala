// process.on('message', function(m, root) {
// 	console.log(m)
// 	process.send({message: 'welcome' });
// 	process.exit()
// });

var fs = require('fs'),
	path = require('path');

process.on('message', function(root) {
	console.log(root)
	var files = walkDirectory(root);
	process.send({message: files.toString()})
	process.exit();
});

function walkDirectory(root){
	var files = [];

	function walk(dir) {
		var dirList = fs.readdirSync(dir);

		for (var i = 0; i < dirList.length; i++) {
			var item = dirList[i];
			
			//过滤系统文件
			if (/^\./.test(item)) {
				continue;
			}

			if(fs.statSync(dir + path.sep + item).isDirectory()) {
				walk(dir + path.sep + item);
			} else {
				files.push(dir + path.sep + item);
			}
		}
	}
	
	walk(root);

	return files;
}