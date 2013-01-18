process.on('message', function(m, root) {
	global.debug(m)
	global.debug(root)
	// if (m === 'walk') {
	// 	var files = walkDirectory(root);
	// 	process.send('walk',JSON.stringify(files))
	// }
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

	return files.filter(isValidFile);
}