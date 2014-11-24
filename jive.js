/* SCOPE CLASS */

function Scope(parent, symbols) {
	this.parent  = parent;
	this.symbols = symbols;
}

Scope.prototype.contains = function(key) {
	if(this.symbols.hasOwnProperty(key)) {
		return true;
	} else if(this.parent !== null) {
		return this.parent.contains(key);
	} else {
		return false;
	}
};
 
Scope.prototype.get = function(key) {
	if(this.symbols[key] !== undefined) {
		return this.symbols[key];
	} else if(this.parent !== null) {
		return this.parent.get(key);
	} else {
		return false;
	}
};
 
Scope.prototype.set = function(key, val) {
	this.symbols[key] = val;
	return true;
};

/* LITERAL CLASSES */

function JString(value) {
	this.value = value;
}

JString.prototype.get = function() {
	return this.value.slice(1,this.value.length-1);
};

JString.prototype.try = function(value) {
	var i = value.indexOf('\'') === 0                  || value.indexOf('\"') === 0,
		j = value.lastIndexOf('\'') === value.length-1 || value.lastIndexOf('\"') === value.length-1;
 
	return i && j ? true : false;
};

function JNumber(value) {
	this.value = parseFloat(value);
}

JNumber.prototype.get = function() {
	return this.value;
};

JNumber.prototype.try = function(value) {
	return isNaN(parseFloat(value)) ? false : true;
};

function isLiteral(input) {
	return JString.prototype.try(input) || JNumber.prototype.try(input);
}

function getLiteral(input) {
	if(JString.prototype.try(input))
		return new JString(input);

	if(JNumber.prototype.try(input))
		return new JNumber(input);
}
 
function parse(input) {
	var i = 0;
 
	function descend(input) {
		var escape  = false,
			atom    = '',
			atomSet = [];
 
		for(i; i<input.length; i++) {
			
			switch(input[i]) {
				case '(':
					i += 1;
 
					atomSet.push( descend( input ) );
					break;
				case ')':
					if(atom.length > 0)
						atomSet.push( isLiteral(atom) ? getLiteral(atom) : atom );
		
					escape = true;
					break;
				case ' ':
					if(atom.length > 0)
						atomSet.push( isLiteral(atom) ? getLiteral(atom) : atom );
 
					atom = '';
					break;
				case '\n':
					if(atom.length > 0)
						atomSet.push( isLiteral(atom) ? getLiteral(atom) : atom );
 
					atom = '';
					break;
				case '\r':
					if(atom.length > 0)
						atomSet.push( isLiteral(atom) ? getLiteral(atom) : atom );
 
					atom = '';
					break;
				case '\t':
					if(atom.length > 0)
						atomSet.push( isLiteral(atom) ? getLiteral(atom) : atom );
 
					atom = '';
					break;
				default:
					atom += input[i];
					break;
			}
 
			if(escape)
				break;
 
		}
 
		return atomSet;
	}
 
	return descend(input);
}

// If we're quoting an expression then we actually want to return the values contained in the wrapper objects
function extract(input) {
	if(input instanceof Array) {
		return input.map(extract);
	} else if(input instanceof JString || input instanceof JNumber) {
		return input.get();
	} else {
		return input;
	}

}

function evaluate(expression, scope) {
	var key, val, test, then, els, params, expr, result, exps;
 
	if(scope.contains(expression)) {
		return scope.get(expression);
 
	} else if(expression instanceof JString || expression instanceof JNumber) {
		return expression.get();
	
	} else if(expression[0].indexOf('`') === 0) {
		var moduleName = expression[0].slice(1),
			module     = require(moduleName),
			symbols    = {};

		Object.keys(module).forEach(function(key) {
			symbols[key] = module[key];
		});

		return evaluate(expression[1], new Scope(scope, symbols));

	} else if(expression[0] === 'quote') {
		return extract(expression[1]);
	
	} else if(expression[0] === 'if') { // (if test then else)
		test = expression[1];
		then = expression[2];
		els  = expression[3];
 
		return evaluate(test, scope) ? evaluate(then, scope) : evaluate(els, scope);
	
	} else if(expression[0] === 'set!') {
		key = expression[1];
		val = expression[2];
 
		if(scope.get(key))
			scope.set(key, evaluate(val, scope));
 
	} else if(expression[0] === 'define') {
		key = expression[1];
		val = expression[2];
 
		scope.set(key, evaluate(val, scope));
 
	} else if(expression[0] === 'lambda') {
		params = expression[1];
		expr   = expression[2];
 
		return function() {
			var args = Array.prototype.slice.call(arguments),
				symbols = {};
 
			for(var i=0; i<params.length; i++)
				symbols[params[i]] = args[i];
 
			return evaluate(expr, new Scope(scope, symbols));
		};
 
	} else if(expression[0] === 'begin') {
		result = null;
		for(var i=1; i<expression.length; i++)
			result = evaluate(expression[i], scope);
 
		return result;
 
	} else {
		exps = expression.map(function(e) { return evaluate(e, scope); });
 
		return exps[0].apply(null, exps.slice(1));
 
	}
}


var fs     = require('fs'),
	core   = require('./core/core.js'),
	module = require('./core/module.js').module;

var GlobalScope = new Scope(null, core.Core);

[
	module('stdlib/stdlib.ji')
].forEach(function(lib) {
	evaluate(parse(lib)[0], GlobalScope);
});

fs.readFile('src/script.ji', {encoding: 'utf-8'}, function(err, data) {
	if(err) throw err;

	var r = evaluate( parse(data)[0], GlobalScope );

	console.log(r);
});

