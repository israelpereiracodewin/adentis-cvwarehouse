
const { series, src, dest, watch, parallel } = require("gulp"),
    babel = require('gulp-babel'),
    uglify = require('gulp-uglify'),
    rename = require("gulp-rename");
    
const babelConfig = {
    presets: ["@babel/preset-env"],
    plugins: ["@babel/plugin-transform-optional-chaining"]
}; 
    

const watchedJSFiles = [
    "./js/job-description.js",
    "./js/job-list.js",
];

const buildMinJS = () => src(watchedJSFiles)
      .pipe(babel(babelConfig))
      .pipe(uglify())
      .pipe(rename({ suffix: '.min' })) 
      .pipe(dest("./js/bundles"))

const addZero = n => n <= 9 ? `0${n}` : n; 

const dateFormat = date =>
    `${(addZero(date.getDate().toString()))}/${(addZero(date.getMonth() + 1).toString())}/${date.getFullYear()} ${addZero(date.getHours()).toString()}:${addZero(date.getMinutes()).toString()}:${addZero(date.getSeconds()).toString()}`;

const watcher = () => watch([
        ...watchedJSFiles, 
    ])
    .on('change', (file, stats) => {   

        console.log('\x1b[36m%s\x1b[0m', `Changed file:`,  '\x1b[33m', file.padStart(55), '\x1b[0m', `| last update: ${dateFormat(stats.atime)} | created at: ${dateFormat(stats.birthtime)}`)

        buildMinJS();
    }); 

exports.default = parallel(watcher);
exports.production = series(buildMinJS);