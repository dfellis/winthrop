var commander = require('commander');
var q = require('queue-flow');
var l = require('lambda-js');
var fs = require('fs');
var run = require('child_process').exec;

// Parse command-line options
commander
    .version('0.1.0')
    .usage('[options] <reponame>')
    .option('-b, --browserify', 'Specifies that the code needs to be run through browserify before minification (default: false)', false)
    .option('-c, --coverage', 'Specifies that source code coverage should be included (default: true)', true)
    .option('-d, --doc <style>', 'Specifies the documentation style to be used to analyze source code (default: docco)', 'docco')
    .option('-e, --executable', 'Specifies that the module can be executed (default: false)', false)
    .option('-g, --global', 'Specifies that the code prefers to be installed globally (default: false)', false)
    .option('-h, --halstead', 'Specifies that Halstead complexity should be calculated (default: true)', true)
    .option('-l, --license', 'Specifies the license to use (default: MIT)', 'MIT')
    .option('-m, --minify', 'Specifies that the code should be minified (default: true)', true)
    .option('-o, --open', 'Specifies that this is open source code (default: true)', true)
    .option('-p, --blog', 'Specifies that this is a GitHub blog and the "gh-pages" branch should be master (default: false)', false)
    .option('-s, --site', 'Specifies that a "gh-pages" branch should be created (default: true, --no-site for false)', true)
    .option('-t, --test <suite>', 'Specifies the test framework to use (default: nodeunit)', 'nodeunit')
    .parse(process.argv);

// Verify doc, test, and license are valid
switch(commander.doc) {
    case 'docco':
    case 'jsdoc3':
    case 'none':
        break;
    case default:
        console.err('Only "docco" and "jsdoc3" are currently supported for documentation.');
        process.exit(-1);
}
switch(commander.test) {
    case 'nodeunit':
    case 'mocha':
    case 'expresso':
    case 'none':
        break;
    case default:
        console.err('Testing frameworks supported: nodeunit, mocha, expresso');
        process.exit(-2);
}
switch(commander.license) {
    case 'MIT':
    case 'BSD':
    case 'GPL':
    case 'LGPL':
    case 'Proprietary':
        break;
    case default:
        console.err('MUST have a license (even "Proprietary")');
        process.exit(-3);
}

// Grab the package.json object and populate it
var package = { json: JSON.parse(fs.readFileSync(__dirname + '/../lib/package.json', 'utf8')) };
package.json.name = commander.reponame;
if(commander.browserify) package.json.devDependencies.browserify = "*";
if(commander.coverage) package.json.devDependencies.jscoverage = "*";
if(commander.doc) package.json.devDependencies[commander.doc] = "*";
if(commander.executable) package.json.bin = "./bin/" + commander.reponame;
if(commander.global) package.json.preferGlobal = true;
if(commander.halstead) package.json.devDependencies['complexity-report'] = "*";
if(commander.minify) package.json.devDependencies['uglify-js'] = "*";
if(!commander.open) package.json.private = true;
if(commander.test) package.json.devDependencies[commander.test] = "*";

// Build the prepublish.sh script
var prepublish = { sh: [] };
prepublish.sh.push(
    '#!/usr/bin/env bash',
    ''
);
if(commander.test) prepublish.sh.push(
    '# Run the tests',
    'npm test',
    ''
);
if(commander.doc) prepublish.sh.push(
    '# Build documentation',
    commander.doc + ' ./lib/' + commander.reponame + '.js',
    ''
);
if(commander.site) prepublish.sh.push(
    '# Build the index page',
    'md2jekyllhtml readme.md',
    'touch new-index.html',
    'echo --- >> new-index.html',
    'echo layout: site >> new-index.html',
    'echo title: ' + commander.reponame + ' >> new-index.html',
    'echo subtitle: ' + package.json.description + ' >> new-index.html',
    'echo --- >> new-index.html',
    'cat readme.html >> new-index.html',
    'rm readme.html',
    'git stash',
    '',
    '# Put the documentation in the gh-pages branch',
    'mv docs docs-new',
    'git checkout gh-pages',
    'rm -rf docs',
    'rm -rf index.html',
    'mv docs-new docs',
    'mv new-index.html index.html',
    'git commit -am "Automatic documentation for version $npm_package_version"',
    'git checkout master',
    'git stash pop',
    ''
);
if(commander.minify && commander.browserify) prepublish.sh.push(
    '# Generate the minified version of the code',
    'browserify ./lib/' + commander.reponame + '.js -o browserify-temp.js',
    'uglifyjs ./lib/browserify-temp.js > ./lib/' + commander.reponame + '.min.js',
    'rm ./lib/browserify-temp.js',
    ''
);
if(commander.minify && !commander.browserify) prepublish.sh.push(
    '# Generate the minified version of the code',
    'uglifyjs ./lib/' + commander.reponame + '.js > ./lib/' + commander.reponame + '.min.js',
    ''
);
prepublish.sh.push(
    '# Commit the changes to master',
    'git commit -am "Automatic minification for version $npm_package_version"',
    'git tag $npm_package_version',
    'git push',
    'git push --tags'
);

// Build the readme.md file
var readme = { md: [] };
readme.md.push(
    '# ' + commander.reponame,
    '',
    'Description Here!',
    '',
    '## Install',
    '',
    '```sh'
);
if(commander.global) readme.md.push(
    'npm install -g ' + commander.reponame
);
if(!commander.global) readme.md.push(
    'npm install ' + commander.reponame
);
readme.md.push(
    '```',
    '',
    '## Usage',
    '',
    'Fill in usage here',
    '',
    '## License (' + commander.license + ')',
    '',
    fs.readFileSync(__dirname + '/../lib/license.' + commander.license, 'utf8')
);

// Async portions below

// Build the site template
var site = { html: fs.readFileSync(__dirname + '/../lib/site.html', 'utf8') };
site.html = site.html.replace(/\${reponame}/g, commander.reponame).replace(/\${repopath}/g, '/' + commander.reponame + '/');

// Build the .travis.yml file
var travis = { yml: fs.readFileSync(__dirname + '/../lib/.travis.yml', 'utf8') };

// Create the repo and finish the site.html and .travis.yml files
q([commander.reponame])
    .exec(fs.mkdir, 'error')
    .map(function(res) {
        process.chdir(process.cwd() + "/" + commander.reponame);
        return "git init";
    })
    .exec(run, 'error')
    .map(l('res', '"npm config get username"'))
    .exec(run, 'error')
    .map(function(result) {
        site.html = site.html.replace(/\${username}/g, result);
        return "npm config get email";
    })
    .exec(run, 'error')
    .map(function(result) {
        travis.yml = travis.yml.replace(/\${email}/g, result);
        return commander.blog ? 'blog' : 'full';
    })
    .branch(function(val) { return val; });
q('blog')
    .map(l('res', '"mkdir _layouts"')
    .exec(run, 'error')
    .map(l('res', 'site.html'))
    .exec(fs.writeFile.bind(fs, process.cwd() + '/_layouts/site.html'), 'error')
    .map(l('res', '"cp " + __dirname + "/../lib/_config.yml ."'))
    .exec(run, 'error')
    .map(l('res', '"mkdir _includes; touch _includes/.gitkeep"'))
    .exec(run, 'error')
    .map(l('res', '"mkdir _posts; touch _posts/.gitkeep"'))
    .exec(run, 'error')
    .map(l('res', '"mkdir _site; touch _site/.gitkeep"'))
    .exec(run, 'error')
    .map(l('res', '"mkdir images; cp " + __dirname + "/../lib/checker.png"'))
    .exec(run, 'error')
    .map(l('res', '"touch index.html;echo --- >> index.html;echo layout: site >> index.html;echo title: " + commander.reponame + " >> index.html;echo subtitle: " + package.json.description + " >> index.html;echo --- >> index.html"'))
    .exec(run, 'error')
    .map(l('res', '"mkdir javascripts;cp " + __dirname + "/../lib/scale.fix.js javascripts/scale.fix.js"'))
    .exec(run, 'error')
    .map(l('res', '"mkdir stylesheets;cp " + __dirname + "/../lib/pygment_trac.css stylesheets/pygment_trac.css;cp " + __dirname + "/../lib/styles.css"'))
    .exec(run, 'error')
    .map(l('res', '"cp " + __dirname + "/../lib/gitignore .gitignore"'))
    .exec(run, 'error')
    .map(l('res', '"git commit -am \'Initial commit by winthrop\'"'))
    .exec(run, 'error');
q('full')
    .map(function() {
        var retVal = "cp " + __dirname + "/../lib/gitignore .gitignore;";
        retVal += "mkdir lib;touch lib/" + commander.reponame + ".js;";
        if(commander.test) retVal += "mkdir test;touch test/test.js;";
        if(commander.executable) retVal += "mkdir bin;touch bin/" + commander.reponame + ".js;chmod +x bin/" + commander.reponame + ".js;";
        return retVal;
    })
    .exec(run, 'error')
    .map(l('res', 'travis.yml'))
    .exec(fs.writeFile.bind(fs, process.cwd() + '/.travis.yml'), 'error')
    .map(l('res', 'JSON.stringify(package.json)'))
    .exec(fs.writeFile.bind(fs, process.cwd() + '/package.json'), 'error')
    .map(l('res', 'prepublish.sh.join("\n")'))
    .exec(fs.writeFile.bind(fs, process.cwd() + '/prepublish.sh'), 'error')
    .map(l('res', '"chmod +x prepublish.sh"'))
    .exec(run, 'error')
    .map(l('res', 'readme.md.join("\n")'))
    .exec(fs.writeFile.bind(fs, process.cwd() + '/readme.md'), 'error')
    .map(l('res', '"git commit -am \'Initial commit by winthrop\'"'))
    .exec(run, 'error')
    .map(l('res', '"git checkout --orphan gh-pages"'))
    .exec(run, 'error')
    .map(l('res', '"git rm -rf ."'))
    .exec(run, 'error')
    .map(l('res', '"mkdir _layouts"')
    .exec(run, 'error')
    .map(l('res', 'site.html'))
    .exec(fs.writeFile.bind(fs, process.cwd() + '/_layouts/site.html'), 'error')
    .map(l('res', '"cp " + __dirname + "/../lib/_config.yml ."'))
    .exec(run, 'error')
    .map(l('res', '"mkdir _includes; touch _includes/.gitkeep"'))
    .exec(run, 'error')
    .map(l('res', '"mkdir _posts; touch _posts/.gitkeep"'))
    .exec(run, 'error')
    .map(l('res', '"mkdir _site; touch _site/.gitkeep"'))
    .exec(run, 'error')
    .map(l('res', '"mkdir images; cp " + __dirname + "/../lib/checker.png"'))
    .exec(run, 'error')
    .map(l('res', '"mkdir javascripts;cp " + __dirname + "/../lib/scale.fix.js javascripts/scale.fix.js"'))
    .exec(run, 'error')
    .map(l('res', '"mkdir stylesheets;cp " + __dirname + "/../lib/pygment_trac.css stylesheets/pygment_trac.css;cp " + __dirname + "/../lib/styles.css"'))
    .exec(run, 'error')
    .map(l('res', '"cp " + __dirname + "/../lib/gitignore .gitignore"'))
    .exec(run, 'error')
    .map(l('res', '"git commit -am \'Initial commit by winthrop\'"'))
    .exec(run, 'error')
    .map(l('res', '"git checkout master"'))
    .exec(run, 'error');
