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
 
function isNumericLiteral(input) {
	return isNaN(parseFloat(input)) ? false : true;
}
 
function isStringLiteral(input) {
	var i = input.indexOf('\'') === 0                  || input.indexOf('\"') === 0,
		j = input.lastIndexOf('\'') === input.length-1 || input.lastIndexOf('\"') === input.length-1;
 
	return i && j ? true : false;
}
 
function isLiteral(input) {
	return isNumericLiteral(input) || isStringLiteral(input);
}

function getLiteral(input) {
	return isNaN(parseFloat(input)) ? input : parseFloat(input);
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
 
function evaluate(expression, scope) {
	var key, val, test, then, els, params, expr, result, exps;
 
	if(scope.contains(expression)) {
		return scope.get(expression);
 
	} else if(isLiteral(expression)) {
		return getLiteral(expression);
	
	} else if(expression[0] === 'quote') {
		return expression[1];
	
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
 
var Globals = {
	'True' : true,
	'False': false,
	'Nil'  : null,

	'=': function(a, b) { return a === b; },
	'>': function(a, b) { return a > b; },
	'<': function(a, b) { return a < b; },
 
	'+': function()     { return Array.prototype.slice.call(arguments).reduce(function(a, b) { return a+b; }); },
	'-': function()     { return Array.prototype.slice.call(arguments).reduce(function(a, b) { return a-b; }); },
	'*': function()     { return Array.prototype.slice.call(arguments).reduce(function(a, b) { return a*b; }); },
	'/': function(a, b) { return a / b; },
	'%': function(a, b) { return a % b;	},

	'log': function(input) { console.log(input); },

	'cons': function(a, b) { return a instanceof Array ? a.concat(b) : [a].concat(b); },
	'car' : function(a)    { return a[0] || null; },
	'cdr' : function(a)    { return a.slice(1); }
};

var fs = require('fs');

fs.readFile('stdlib.ji', {encoding: 'utf-8'}, function(err, data) {
	if(err) throw err;

	var r = evaluate( parse(data)[0], new Scope(null, Globals) );

	console.log(r);
});

