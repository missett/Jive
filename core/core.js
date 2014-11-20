var Core = {
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

exports.Core = Core;