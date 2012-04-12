var Path = require('path');
var ugly = require("uglify-js");
var clean = require("clean-css");
var fs = require('fs');
var jsp = ugly.parser;
var pro = ugly.uglify;

module.exports = function(window, data, opts) {
	var $ = window.$;
	processTags('script', 'src', minifyJS, $, opts);
	processTags('link', 'href', minifyCSS, $, opts);
};

function processTags(tag, att, minfun, $, opts) {
	var files = {};
	$(tag+'[notemplate\\:minify!=""]').each(function() {
		if (opts.notemplate.minify != false) {
			var src = $(this).attr(att);
			var dst = $(this).attr("notemplate:minify");
			var list = files[dst] || [];
			list.push(src);
			if (!files[dst]) files[dst] = list;
		} else {
			$(this).get(0).attributes.removeNamedItem('notemplate:minify');
		}
	});
	if (opts.notemplate.minify != false) {
		for (var dst in files) {
			if (!minified(opts.filename, opts.notemplate.public, dst, files[dst])) minfun(opts.notemplate.public, dst, files[dst]);
			var nodes = $(tag+'[notemplate\\:minify="'+dst+'"]');
			var last = nodes.last().get(0);
			nodes.slice(0, -1).remove();
			last.attributes.removeNamedItem('notemplate:minify');
			last.attributes[att].value = dst;
		}
	}
}

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
			console.error("Cannot check if missing file is minified :", src);
			return false;
		}
		if (fs.statSync(src).mtime.getTime() > dstTime) return false;
		return true;
	});
}

function minifyJS(public, dst, sources) {
	var dst = Path.join('.', public, dst);
	var fd = fs.openSync(dst, 'w');
	sources.forEach(function(src) {
		var src = Path.join('.', public, src);
		var buf = fs.readFileSync(src);
		if (buf == null) return console.error("Cannot minify empty file :", src);
		var ast = jsp.parse(buf.toString());
		ast = pro.ast_mangle(ast);
		ast = pro.ast_squeeze(ast);
		fs.writeSync(fd, pro.gen_code(ast) + ";\n");
	});
	fs.closeSync(fd);
}

function minifyCSS(public, dst, sources) {
	var dst = Path.join('.', public, dst);
	var fd = fs.openSync(dst, 'w');
	sources.forEach(function(src) {
		var src = Path.join('.', public, src);
		fs.writeSync(fd, clean.process(cssImportRule(src)) + "\n");
	});
	fs.closeSync(fd);
}

function cssImportRule(path) {
	var text = fs.readFileSync(path, 'utf8');
	if (text == null) return "";

	return text.replace(/^\s*@import\s+(?:url\()?["']([^"']*)["'](?:\))?;?/gm, function(match, p1, offset, s) {
		var newpath = Path.join(Path.dirname(path), p1);
		return cssImportRule(newpath);
	});
}
