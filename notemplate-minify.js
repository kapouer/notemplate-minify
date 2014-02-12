var Path = require('path');
var ugly = require("uglify-js");
var clean = require("clean-css");
var prefixer = require('autoprefixer');
var fs = require('fs');
var jsp = ugly.parser;
var pro = ugly.uglify;
var fexistsSync = fs.existsSync || Path.existsSync;
var mkdirp;
try {
	mkdirp = require('mkdirp');
} catch(e) {}

module.exports = function(view, opts) {
	var $ = view.window.$;
	var settings = {
		minify: opts.settings.minify == null || opts.settings.minify,
		statics: opts.settings.statics || process.cwd() + '/public',
		viewmtime: view.mtime
	}
	processTags('script', 'src', concatenateJS, $, settings);
	processTags('link', 'href', concatenateCSS, $, settings);
};

function processTags(tag, att, minfun, $, settings) {
	var files = {};
	$(":root > head > " + tag + '[notemplate\\:minify]').each(function() {
		if (settings.minify) {
			var src = $(this).attr(att);
			var dst = $(this).attr("notemplate:minify");
			var list = files[dst] || {sources: [], classes: [], atts: {}};
			list.sources.push(src);
			list.classes.push($(this).attr('class'));
			for (var i=0, len = this.attributes.length; i < len; i++) {
				var item = this.attributes.item(i);
				if (item.name && item.name.indexOf('notemplate:') == 0 && item.name.indexOf('notemplate:minify') < 0) list.atts[item.name] = item.value;
			}
			if (!files[dst]) files[dst] = list;
		} else {
			$(this).get(0).attributes.removeNamedItem('notemplate:minify');
		}
	});
	if (settings.minify) {
		for (var dst in files) {
			var lists = files[dst];
			if (!minified(settings.viewmtime, settings.statics, dst, lists.sources)) {
				// ensures dst dir exists
				var dirdst = Path.dirname(Path.join(settings.statics, dst));
				if (!fexistsSync(dirdst)) {
					if (!mkdirp) throw new Error("No such directory: " + dirdst + "\nInstall mkdirp to automatically create one.");
					mkdirp.sync(dirdst);
				}
				minfun(settings.statics, dst, lists.sources, settings.minify);
			}
			var nodes = $(tag+'[notemplate\\:minify="'+dst+'"]');
			var last = nodes.last();
			nodes.slice(0, -1).remove();
			last.removeAttr('notemplate:minify');
			last.attr(att, dst);
			last.addClass(lists.classes.join(' '));
			for (var name in lists.atts) {
				last.attr(name, lists.atts[name]);
			}
		}
	}
}

function minified(viewmtime, public, dst, sources) {
	// return true if dst exists has been modified after all files
	var dst = Path.join(public, dst);
	if (!fexistsSync(dst)) return false;
	var dstTime = fs.statSync(dst).mtime.getTime();
	var tmplTime = viewmtime.getTime();
	if (tmplTime > dstTime) return false;
	return sources.every(function(src) {
		var src = Path.join(public, src);
		if (!fexistsSync(src)) {
			console.error("Cannot check if missing file is minified :", src);
			return false;
		}
		if (fs.statSync(src).mtime.getTime() > dstTime) return false;
		return true;
	});
}

function concatenateJS(public, dst, sources, minify) {
	var dst = Path.join(public, dst);
	var fd = fs.openSync(dst, 'w');
	sources.forEach(function(src) {
		var src = Path.join(public, src);
		var buf = fs.readFileSync(src);
		if (buf == null) return console.error("Cannot minify empty file :", src);
		if (minify != "cat") {
			var ast = jsp.parse(buf.toString());
			ast = pro.ast_mangle(ast);
			ast = pro.ast_squeeze(ast);
			buf = pro.gen_code(ast);
		}
		fs.writeSync(fd, buf + ";\n");
	});
	fs.closeSync(fd);
}

function concatenateCSS(public, dst, sources, minify) {
	var dst = Path.join(public, dst);
	var fd = fs.openSync(dst, 'w');
	sources.forEach(function(src) {
		var src = Path.join(public, src);
		var str = cssImportRule(src, dst);
		str = prefixer.process(str).css;
		if (minify != "cat") {
			str = clean.process(str, {keepSpecialComments:0});
		}
		fs.writeSync(fd, str + "\n");
	});
	fs.closeSync(fd);
}

function fixRelativePaths(src, dst, text) {
	var srcDir = Path.dirname(src);
	var dstDir = Path.dirname(dst);
	var relativePath = Path.relative(Path.dirname(dst), Path.dirname(src));
	if (!relativePath) return text;
	var text = text.replace(/(url\(["'])([^"']*)(["']\))|(@import\s+(?:url\()?["'])([^"']*)(["'])(?:\))?/gm, function(match, p1, p2, p3, p4, p5, p6, offset, s) {
		var left = p1 || p4;
		var inside = p2 || p5;
		if (!/^\s*(data:|https?:\/\/|\/\/)/.test(inside)) inside = Path.join(relativePath, inside);
		var right = p3 || p6;
		return left + inside + right;
	});
	return text;
}

function cssImportRule(src, dst) {
	var text = fs.readFileSync(src, 'utf8');
	if (text == null) return "";
	text = fixRelativePaths(src, dst, text);

	return text.replace(/^\s*@import\s+(?:url\()?["']([^"']*)["'](?:\))?;?/gm, function(match, p1, offset, s) {
		var newsrc = Path.join(Path.dirname(dst), p1);
		return cssImportRule(newsrc, dst);
	});
}
