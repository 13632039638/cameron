const gulp = require('gulp');
const less = require('gulp-less');
const cssmin = require('gulp-clean-css');
const rename = require('gulp-rename');

function compileCSS() {
    return gulp.src(['../packages/marketChart/**/*.less'])
        .pipe(less())
        .pipe(cssmin())
        .pipe(rename((path) => {
            path.extname = '.wxss';
        }))
        .pipe(gulp.dest('../examples/dist/'));
}

function compileJS() {
    return gulp.src(['../packages/marketChart/**/*.js'])
        .pipe(gulp.dest('../examples/dist/'))
}

function compileJSON() {
    return gulp.src(['../packages/marketChart/**/*.json'])
        .pipe(gulp.dest('../examples/dist/'))
}

function compileWxml() {
    return gulp.src(['../packages/marketChart/**/*.wxml'])
        .pipe(gulp.dest('../examples/dist/'))
}

function watchFiles() {
    gulp.watch('../packages/marketChart/**/*.less', compileCSS);
    gulp.watch('../packages/marketChart/**/*.js', compileJS);
    gulp.watch('../packages/marketChart/**/*.json', compileJSON);
    gulp.watch('../packages/marketChart/**/*.wxml', compileWxml);
}

exports.default = gulp.series(
    gulp.parallel(compileCSS, compileJS, compileJSON, compileWxml),
    watchFiles
);
