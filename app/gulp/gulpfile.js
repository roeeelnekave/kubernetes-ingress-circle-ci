const { task, series } = require('gulp');

const config = require('../../gulp-config');

function requireUncached(module) {
    delete require.cache[require.resolve(module)];
    return require(module);
}

const js = require('kisphp-assets/tasks/javascripts')(config.js.external);
const bsrf = requireUncached('kisphp-assets/tasks/browserify')(config.js.project);
const css = require('kisphp-assets/tasks/css')(config.css.external);
const incss = requireUncached('kisphp-assets/tasks/css')(config.css.project);
const files = require('kisphp-assets/tasks/copy_files')(config.files);

task('default', series(
    files.copy_files,
    css.css,
    incss.css,
    js.javascripts,
    bsrf.browserify,
));

