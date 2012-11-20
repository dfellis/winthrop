# node-winthrop

git repo generator for node modules

## ["for wee must Consider that wee shall be as a Citty upon a Hill, the eies of all people are uppon us"](https://www.mtholyoke.edu/acad/intrel/winthrop.htm)

Whatever your opinion of John Winthrop and the Puritans, we open source developers do have a few things in common with them. When we publish our code as open source, we're asking for others to bring their "eies uppon" it. We expect that others will make use of it. And [we're generally opinionated enough](http://en.wikiquote.org/wiki/Linus_Torvalds#1995) that we expect others to mimic our style.

``winthrop`` is my opinionated take on what an open source node module should look like based on my experience developing various such modules, culminating in the structure of [queue-flow](https://github.com/dfellis/queue-flow). Customization is included, but isn't the focus -- the default produces the kind of structure I prefer, and I think you should prefer it, too. ;)

## Installation

```bash
npm install -g winthrop
```

## Usage

```
TODO: commander help goes here
```

## What winthrop makes by default and why

If you run ``winthrop repo-name``, what do you get?

```
repo-name/
    .git/
    .gitignore
    .travis.yml
    lib/
        repo-name.js
        repo-name.min.js
    package.json
    prepublish.sh
    readme.md
    test/
        test.js
```

### repo-name/

Like a ``git clone`` command gives you when you grab an open-source repo, the directory name of the repo matches what you type.

### .git/

The git repo is automatically initialized with these files committed to ``master``, and a [jekyll](https://github.com/mojombo/jekyll) site initialized in the ``gh-pages`` branch (more on that below).

### .travis.yml

From personal experience, even if you locally test things before every publish to npm, [Travis CI](https://travis-ci.org/) can still help you by testing under multiple node version (and you should try to support at least one prior "release" version so there is a clear upgrade path for your library, in my opinion). Unfortunately Travis only tests under a Linux environment so free automated testing of Windows and OS X support (supported environments for Node.js) is unavailable.

This file will be auto-populated for Node version 0.6.x and 0.8.x, and will attempt to get your email address from ``npm config get email`` or ``git config user.email`` to send you notifications on Travis build failures and successes when transitioning from failure to success and vice versa.

### lib/

Source code should be separate from the module configuration, documentation, and testing. ``lib`` is the name I chose because all of the files in the repo should be source code (or support for that source code, like images) so ``src`` seems redundant to me. The ``lib`` directory contains the file or files that can be ``require``d in other source code, including the test file and executable file (if applicable), so calling ``lib``rary code feels correct to me.

### repo-name.js

A blank file that your source code is intended to be put into. This is the file you edit.

### repo-name.min.js

A blank file that minified source code is intended to be put into. Most of my modules are designed to also run in web browsers, so this is turned on by default.

The rationale for storing and version-controlling auto-generated code falls on the "exception that proves the rule" principle. Normally you shouldn't store auto-generated code because your build process can generate it whenever necessary, but as Javascript is not a compiled language, and many front-end developers don't have a Node toolchain set up, making the minified version available to them is a useful activity.

By default it uses [UglifyJS](https://github.com/mishoo/UglifyJS) to do this minification, which assumes that your module source code is in a single file. My personal perspective is that modules that need a source code hierarchy should actually split into multiple modules, but if these sub-tree files are essentially useless on their own, then this behavior can be overridden and [browserify](https://github.com/substack/node-browserify) can be turned on to run as an intermediate step to generating the minified code.

### package.json

Necessary for any node module, this package.json is auto-populated with data from the ``npm config`` and ``git config`` keys, the repo name provided, the test, preopublish, lib and bin settings configured, and whether or not this is a public repo and/or should be installed globally. Ideally the only pieces you need to touch are description, git url, and issue tracker. (Future additions to ``winthrop`` may make all of that obsolete and allow the remote github repo to be created from the command line.)

### prepublish.sh

A simple series of commands to execute to perform the automatic documentation (more on that later), source code minification, testing, git commits and tags. The exact lines of code depend on which of these various features have been turned on. Improving this code to cleanly roll back when any particular step fails is planned.

### readme.md

The readme file for the project. A skeleton is automatically generated with the project name, installation instructions (assuming it will be published to npm with the same name), and license chosen.

### test/

The location for the tests. Open source modules generally aren't end-use applications, so there is a focus in ``winthrop`` on unit testing. Supporting integration testing may come with future revisions, but that generally requires a more complicated test command, not a simple ``npm test``.

### test.js

This is purely personal opinion, but tests should be straightforward to read and independent of one another, so it doesn't really matter if its one large file as long as your test suite allows choosing which test you want to run, like [nodeunit](https://github.com/caolan/nodeunit) does.

## The ``gh-pages`` branch

``winthrop`` assumes, by default, that you're making a GitHub repo. GitHub will interpret a branch named ``gh-pages`` differently from every other branch. This branch is intended to be a place where larger volumes of documentation with a nicer, customizable theme. GitHub has a nice web interface for creating a single-page website for your library, but that's very limiting and can only be updated manually. Alternatively, you can control it yourself with a ``jekyll`` static site, allowing multiple pages, blog-like posts, and total control over your theme.

Because setting up a jekyll site from scratch is even more of a pain than setting up a node module from scratch, ``winthrop`` will do all of this heavy-lifing as well, by default, because you should be creating documentation for your code and have an undistracting page dedicated to that documentation, right?

And since its git-controlled it can also be partially updated automatically by the ``prepublish.sh`` script to automatically generate documentation from your comments and source code using [docco](http://jashkenas.github.com/docco/). I absolutely detest the Javadoc style, but if that's your thing, ``winthrop`` can be configured to use [jsdoc3](https://github.com/jsdoc3/jsdoc) instead. ``winthrop`` will also be default convert your ``readme.md`` file into the ``index.html`` file of the ``gh-pages`` branch using [md2jekyllhtml](https://github.com/dfellis/md2jekyllhtml) so your introductory content only needs to be written once.

The full default file structure of the ``gh-pages`` branch follows:

```
repo-name/
    .git/
    .gitignore
    _config.yml
    _includes/
        .gitkeep
    _layouts/
        site.html
    _posts/
        .gitkeep
    _site/
        .gitkeep
    docs/
        docco.css
        repo-name.html
    images/
        checker.png
    index.html
    javascripts/
        scale.fix.js
    stylesheets/
        pygment_trac.css
        styles.css
```

I will ignore ``.git/`` and ``.gitignore`` as they have already been covered. ``.gitkeep`` is an empty file simply to guarantee that the directory exists in the repository (jekyll will fail if some of these directories don't exist). The files in the ``images/``, ``javascripts/`` and ``stylesheets/`` directories are originally from [this GitHub Pages template by orderedlist](https://github.com/orderedlist/modernist). I forked it and converted it into a Jekyll template, solving some issues with multiple pages and inline images I discovered primarily when writing the [queue-flow tutorial](http://dfellis.github.com/queue-flow/2012/09/21/tutorial/).

### _config.yml

This is where jekyll configuration settings are stored. The default is to use the [maruku](http://maruku.rubyforge.org/) markdown engine, not show post marked for the future (so you can prepare posts and have them made public when desired), and to use "pretty" URLs (http://username.github.com/project-name/year/month/day/blog-post-title). There are no configuration settings in ``winthrop`` to change these defaults, but they can be easily edited after initialization.

## site.html

This is the template file for the index and blog posts. jekyll doesn't have a default template, so it must be defined in each file at the top (see the auto-generated index.html file for how to do that).

## docs/

Auto-generated documentation is placed in here. By default docco is used, which creates a ``docco.css`` and ``repo-name.html`` file. A link to this auto-generated documentation is hardwired into the ``site.html`` file to come after all blog posts managed by jekyll.

This documentation is generated on the ``master`` branch and is then committed on the ``gh-pages`` branch through trickery in the ``prepublish.sh`` script.

## index.html

By default, this file is auto-generated by the ``prepublish.sh`` script as well, using data from the ``readme.md`` and ``package.json`` files.

## Other things done by ``winthrop`` by default

``winthrop`` will also assume that you want to run source code coverage and complexity metrics in your tests, and add [jscoverage](https://github.com/sunfang1cn/node-jscoverage) and [complexityReport.js](https://github.com/philbooth/complexityReport.js) to the ``devDependencies`` in your ``package.json`` file. However, ``winthrop`` can't automatically generate the test code to use these libraries. You should read [queue-flow's tests](https://github.com/dfellis/queue-flow/blob/master/test/test.js) to see how they are incorporated. (Also, ignore visionmedia's warnings about the version of jscoverage in npm, it works perfectly fine while his own does not.)

# License (MIT)

Copyright (C) 2012 by David Ellis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
