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
notemplate-minify provides a very simple yet configurable way to do that:.


Express 3 Setup
---------------

	var notemplate = require('express-notemplate');
	// minify config variable accepts false, "cat", true.
	// false doesn't do a thing
	// "cat" autoprefixes and concatenates without minifying
	// true autoprefixes, concatenates, and minifies.
	app.set('minify', app.settings.env != "development");
	// app.set('minify', false | "cat" | true);
	app.set('statics', process.cwd() + '/public');
	app.set('views', process.cwd() + '/views');
	app.engine('html', notemplate.__express);
	app.set('view engine', 'html');
	app.use(express.static(app.get('statics')));
	// this will check if minification is needed only once, not each time the view is rendered
	notemplate.on('ready', require('notemplate-minify'));

	// this will check if minification is needed every time the view is rendered - avoid it even if it's not an intensive task
	notemplate.on('render', require('notemplate-minify'));


Usage
-----

Starting from some script tags, you decide which ones are going to be merged/minified, and to which file :

	<link rel='stylesheet' type='text/css' notemplate:minify="stylesheets/mypage.min.css" href='stylesheets/boilerplate.css' />
	<link rel='stylesheet' type='text/css' notemplate:minify="stylesheets/mypage.min.css" href='stylesheets/mypage.css' />
	<link rel='stylesheet' type='text/css' notemplate:minify="stylesheets/mypage.min.css" href='stylesheets/jqueryui-theme/jquery.ui.all.css' />
	<link rel='stylesheet' type='text/css' notemplate:minify="stylesheets/mypage.min.css" href='stylesheets/jqueryui-timepicker.css' />
	<!--[if lte IE 8]><link rel="stylesheet" href="stylesheets/ie.css" notemplate:minify="stylesheets/ie.min.css" /> /><![endif]-->

	<script src="javascripts/modernizr.js"></script>
	<script class="bundle" src="javascripts/jquery.js" notemplate:minify="javascripts/bundle.js"></script>
	<script class="bundle" src="javascripts/moment.js" notemplate:minify="javascripts/bundle.js"></script>
	<script class="bundle extra" src="javascripts/moment.fr.js" notemplate:minify="javascripts/bundle.js"></script>
	<script src="javascripts/jquery-ui.js" notemplate:minify="javascripts/jqueryui.min.js"></script>
	<script src="javascripts/jquery-ui.fr.js" notemplate:minify="javascripts/jqueryui.min.js" notemplate:john="doe"></script>

This will produce three new files, mypage.min.css, bundle.js and jqueryui.min.js, containing the minified and merged files.
On top of that, thanks to using express-notemplate, the rendered html is automatically modified to be :

	<link rel='stylesheet' type='text/css' href='stylesheets/mypage.min.css' />
	<script src="javascripts/modernizr.js"></script>
	<script class="bundle extra" src="javascripts/bundle.js"></script>
	<script src="javascripts/jqueryui.min.js" notemplate:john="doe"></script>

As seen in this example, class attributes are saved and added, and notemplate:* attributes are kept and overwritten.


Features
--------

Stylesheets are auto-prefixed and minified when:
* their sources are modified
* any template using them is modified


KNOWN BUGS
----------

Q minified file not up-to-date.
A	When deploying or pulling from git, `touch views/*`

Q if a stylesheet and its images is in a subdir of the minified css, the
	paths will be wrong.
A	Add a symlink to the subdir assets in the dir containing the minified file.
