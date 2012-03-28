var Path = require('path');
var ugly = require("uglify-js");
var fs = require('fs');
var jsp = ugly.parser;
var pro = ugly.uglify;

// var orig_code = "... JS code here";
// var ast = jsp.parse(orig_code); // parse code and get the initial AST
// ast = pro.ast_mangle(ast); // get a new AST with mangled names
// ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
// var final_code = pro.gen_code(ast); // compressed code here

module.exports = function(window, data, opts) {
	var files = {};
	var $ = window.$;
	$('script[notemplate\\:minify!=""]').each(function() {
		var src = $(this).attr('src');
		var dst = $(this).attr("notemplate:minify");
		var list = files[dst] || [];
		list.push(src);
		if (!files[dst]) files[dst] = list;
	});
	for (var dst in files) {
		if (!minified(opts.filename, opts.public, dst, files[dst])) minify(opts.public, dst, files[dst]);
		var nodes = $('script[notemplate\\:minify="'+dst+'"]');
		var last = nodes.last().get(0);
		nodes.slice(0, -1).remove();
		last.attributes.removeNamedItem('notemplate:minify');
		last.attributes.src.value = dst;
	}
};

function minified(templatepath, public, dst, sources) {
	// return true if dst exists has been modified after all files
	var dst = Path.join('.', public, dst);
	if (!Path.existsSync(dst)) return false;
	var dstTime = fs.statSync(dst).mtime.getTime();
	var tmplTime = fs.statSync(templatepath).mtime.getTime();
	if (tmplTime > dstTime) return false;
	return sources.every(function(src) {
		var src = Path.join('.', public, src);
		if (!Path.existsSync(src)) {
			console.err("Cannot check if missing file is minified :", src);
			return false;
		}
		if (fs.statSync(src).mtime.getTime() > dstTime) return false;
		return true;
	});
}

function minify(public, dst, sources) {
	var dst = Path.join('.', public, dst);
	var fd = fs.openSync(dst, 'w');
	sources.forEach(function(src) {
		var src = Path.join('.', public, src);
		var buf = fs.readFileSync(src);
		if (buf == null) return console.err("Cannot minify empty file :", src);
		var ast = jsp.parse(buf.toString());
		ast = pro.ast_mangle(ast);
		ast = pro.ast_squeeze(ast);
		fs.writeSync(fd, pro.gen_code(ast) + ";\n");
	});
	fs.closeSync(fd);
}
