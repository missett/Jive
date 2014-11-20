var fs = require('fs');

exports.module = function(name) {
	return fs.readFileSync(name, {encoding: 'utf-8'});
};