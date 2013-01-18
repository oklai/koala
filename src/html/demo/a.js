var child = require('child_process').fork('b.js');

	child.on('message', function(m){
		console.log(m);
	});

	child.send({message: 'C:\\Users\\ethanlai\\Desktop\\yuicompressor\\node'});
