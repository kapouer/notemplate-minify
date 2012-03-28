notemplate-minify
=================

Middleware for express-notemplate.
Minify and merge javascript assets, and configure it with xhtml attributes.

Why ?
-----

Javascript libraries are easier to distribute, debug and even understand when they are not minified.
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

	<script src="javascripts/modernizr.js"></script>
	<script src="javascripts/jquery.js" notemplate:minify="javascripts/bundle.js"></script>
	<script src="javascripts/moment.js" notemplate:minify="javascripts/bundle.js"></script>
	<script src="javascripts/moment.fr.js" notemplate:minify="javascripts/bundle.js"></script>
	<script src="javascripts/jquery-ui.js" notemplate:minify="javascripts/jqueryui.min.js"></script>
	<script src="javascripts/jquery-ui.fr.js" notemplate:minify="javascripts/jqueryui.min.js"></script>

This will produce two new files, bundle.js and jqueryui.min.js, containing the minified and merged files.
On top of that, the rendered html will be :

	<script src="javascripts/modernizr.js"></script>
	<script src="javascripts/bundle.js"></script>
	<script src="javascripts/jqueryui.min.js"></script>


Features
--------

The minified files are automatically updated when their sources are modified.
