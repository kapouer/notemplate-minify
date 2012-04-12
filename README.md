notemplate-minify
=================

Middleware for express-notemplate.
Minify and merge javascript and css assets, configurable with xhtml attributes.

Why ?
-----

Javascript libraries and their CSS stylesheets are easier to distribute,
debug and even understand when they are not minified.
That way it is possible to :

* npm install myjslib
* ln -s ./node_modules/myjslib/mylib.js public/javascripts/mylib.js
* debug
* npm update myjslib

On production one wants to minify and reduce the number of js files to be loaded.
notemplate-minify provides a very simple yet configurable way to do that.


Setup
-----

	// ...
	var notemplate = require('express-notemplate');
	// ...
	app.configure(function(){
		app.set('views', __dirname + '/views');
		app.register('.html', notemplate);
		app.set('view engine', 'html');
		app.set('view options', {
			layout: false
		});
		notemplate.on('render', require('notemplate-minify'));
	});


Usage
-----

Starting from some script tags, you decide which ones are going to be merged/minified, and to which file :

	<link rel='stylesheet' type='text/css' notemplate:minify="stylesheets/mypage.min.css" href='stylesheets/boilerplate.css' />
	<link rel='stylesheet' type='text/css' notemplate:minify="stylesheets/mypage.min.css" href='stylesheets/mypage.css' />
	<link rel='stylesheet' type='text/css' notemplate:minify="stylesheets/mypage.min.css" href='stylesheets/jqueryui-theme/jquery.ui.all.css' />
	<link rel='stylesheet' type='text/css' notemplate:minify="stylesheets/mypage.min.css" href='stylesheets/jqueryui-timepicker.css' />

	<script src="javascripts/modernizr.js"></script>
	<script src="javascripts/jquery.js" notemplate:minify="javascripts/bundle.js"></script>
	<script src="javascripts/moment.js" notemplate:minify="javascripts/bundle.js"></script>
	<script src="javascripts/moment.fr.js" notemplate:minify="javascripts/bundle.js"></script>
	<script src="javascripts/jquery-ui.js" notemplate:minify="javascripts/jqueryui.min.js"></script>
	<script src="javascripts/jquery-ui.fr.js" notemplate:minify="javascripts/jqueryui.min.js"></script>

This will produce three new files, mypage.min.css, bundle.js and jqueryui.min.js, containing the minified and merged files.
On top of that, thanks to using express-notemplate, the rendered html is automatically modified to be :

	<link rel='stylesheet' type='text/css' href='stylesheets/mypage.min.css' />
	<script src="javascripts/modernizr.js"></script>
	<script src="javascripts/bundle.js"></script>
	<script src="javascripts/jqueryui.min.js"></script>


Features
--------

The minified files are automatically updated :
* when their sources are modified
* when any template using them is modified


KNOWN BUGS
----------

If the files are symlinks, modifying them won't be noticed.
Workaround :
 either touch the directory containing them, or the template file.
