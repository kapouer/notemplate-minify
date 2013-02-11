var Path = require('path');
var ugly = require("uglify-js");
var clean = require("clean-css");
var fs = require('fs');
var jsp = ugly.parser;
var pro = ugly.uglify;

module.exports = function(view, opts) {
	var $ = view.window.$;
	var settings = {
		minify: opts.settings.minify == null || opts.settings.minify,
		statics: opts.settings.statics || process.cwd() + '/public',
		viewmtime: view.mtime
	}
	processTags('script', 'src', minifyJS, $, settings);
	processTags('link', 'href', minifyCSS, $, settings);
};

function processTags(tag, att, minfun, $, settings) {
	var files = {};
	$(tag+'[notemplate\\:minify]').each(function() {
		if (settings.minify) {
			var src = $(this).attr(att);
			var dst = $(this).attr("notemplate:minify");
			var list = files[dst] || [];
			list.push(src);
			if (!files[dst]) files[dst] = list;
		} else {
			$(this).get(0).attributes.removeNamedItem('notemplate:minify');
		}
	});
	if (settings.minify) {
		for (var dst in files) {
			if (!minified(settings.viewmtime, settings.statics, dst, files[dst])) minfun(settings.statics, dst, files[dst]);
			var nodes = $(tag+'[notemplate\\:minify="'+dst+'"]');
			var last = nodes.last().get(0);
			nodes.slice(0, -1).remove();
			last.attributes.removeNamedItem('notemplate:minify');
			last.attributes[att].value = dst;
		}
	}
}

function minified(viewmtime, public, dst, sources) {
	// return true if dst exists has been modified after all files
	var dst = Path.join(public, dst);
	if (!Path.existsSync(dst)) return false;
	var dstTime = fs.statSync(dst).mtime.getTime();
	var tmplTime = viewmtime.getTime();
	if (tmplTime > dstTime) return false;
	return sources.every(function(src) {
		var src = Path.join(public, src);
		if (!Path.existsSync(src)) {
			console.error("Cannot check if missing file is minified :", src);
			return false;
		}
		if (fs.statSync(src).mtime.getTime() > dstTime) return false;
		return true;
	});
}

function minifyJS(public, dst, sources) {
	var dst = Path.join(public, dst);
	var fd = fs.openSync(dst, 'w');
	sources.forEach(function(src) {
		var src = Path.join(public, src);
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
	var dst = Path.join(public, dst);
	var fd = fs.openSync(dst, 'w');
	sources.forEach(function(src) {
		var src = Path.join(public, src);
		fs.writeSync(fd, clean.process(cssImportRule(src, dst), {keepSpecialComments:0}) + "\n");
	});
	fs.closeSync(fd);
}

function fixRelativePaths(src, dst, text) {
	var srcDir = Path.dirname(src);
	var dstDir = Path.dirname(dst);
	var relativePath = Path.relative(Path.dirname(dst), Path.dirname(src));
	if (!relativePath) return text;
	var text = text.replace(/(url\(["'])([^"']*)(["']\))/gm, function(match, p1, p2, p3, offset, s) {
		return p1 + Path.join(relativePath, p2) + p3;
	});
	return text;
}

function cssImportRule(src, dst) {
	var text = fs.readFileSync(src, 'utf8');
	if (text == null) return "";
	else return fixRelativePaths(src, dst, text);

	return text.replace(/^\s*@import\s+(?:url\()?["']([^"']*)["'](?:\))?;?/gm, function(match, p1, offset, s) {
		var newsrc = Path.join(Path.dirname(src), p1);
		return cssImportRule(newsrc, dst);
	});
}
