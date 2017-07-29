var data = require('./config');
var config = data.config;
var buildConfig = data.paths.build;
var srcConfig = data.paths.src;

let $ = require('gulp-load-plugins')();
let gulp = require('gulp');
var fs = require('fs');
var rimraf = require('rimraf');
var sequence = require('run-sequence');
var argv = require('yargs').argv;
var isProduction = !!(argv.production);
var merge = require('merge-stream');
var path = require('path');

function getFolders(dir) {
    return fs.readdirSync(dir)
        .filter(function(file) {
            return fs.statSync(path.join(dir, file)).isDirectory();
        });
}

function getFiles(dir, type) {
    return fs.readdirSync(dir).filter(function(file) {
        if (fs.statSync(path.join(dir, file)).isFile()) {
            let fileType = file.substring(file.lastIndexOf('.') + 1, file.length);
            if (fileType === type) {
                return true;
            }
        }
        return false;
    });
}

//清除dist的所有内容
gulp.task('clean', function(cb) {
    rimraf(config.buildPath, cb);
});


//打包app.js文件
gulp.task('pack:app', function() {
    var uglify = $.if(isProduction, $.uglify()
        .on('error', function(e) {
            console.log(e);
        }));

    return gulp.src(srcConfig.appJs)
        .pipe($.concat('app.js'))
        .pipe(uglify)
        .pipe($.babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest(buildConfig.appJs));
});


//将html模版复制过去
gulp.task('copy:template', function() {
    return gulp.src(srcConfig.template, {
            base: './src/'
        })
        .pipe($.rename({ dirname: '' }))
        .pipe(gulp.dest(buildConfig.template));
});


//复制res文件夹里的东西到目标文件夹
gulp.task('copy:res', function() {
    return gulp.src(srcConfig.res, {
        base: './src/'
    }).pipe(gulp.dest(buildConfig.res));
});

//将bootstrap复制过去
gulp.task('copy:bootstrapCss', function() {
    var minifyCss = $.if(isProduction, $.minifyCss()
        .on('error', function(e) {
            console.log(e);
        }));

    return gulp.src(srcConfig.bootstrap.css)
        .pipe(minifyCss)
        .pipe(gulp.dest(buildConfig.bootstrap.css));
});

//将bootstrap复制过去
gulp.task('copy:bootstrapFonts', function() {
    return gulp.src(srcConfig.bootstrap.fonts)
        .pipe(gulp.dest(buildConfig.bootstrap.fonts));
});

//打包vendor.js文件
gulp.task('pack:vendor', function() {
    return gulp.src([srcConfig.jquery, srcConfig.bootstrap.js])
        .pipe($.concat('vendor.js'))
        .pipe(gulp.dest(buildConfig.vendor));
});

// Compiles less
gulp.task('pack:appCss', function() {
    var minifyCss = $.if(isProduction, $.minifyCss()
        .on('error', function(e) {
            console.log(e);
        }));

    return gulp.src(srcConfig.style)
        .pipe($.less())
        .pipe($.concat('app.css'))
        .pipe($.autoprefixer({
            browsers: ['last 2 versions', 'ie 10']
        }))
        .pipe(minifyCss)
        .pipe(gulp.dest(buildConfig.appCss));
});

gulp.task('pack:pagesJs', function() {
    var folders = getFolders(srcConfig.pagesSource);
    var tasks = folders.map(function(folder) {
        var uglify = $.if(isProduction, $.uglify()
            .on('error', function(e) {
                console.log(e);
            }));
        return gulp.src(path.join(srcConfig.pagesSource, folder, '/*.js'))
            .pipe($.concat(folder + '.js'))
            .pipe($.babel({
                presets: ['es2015']
            }))
            .pipe(uglify)
            .pipe(gulp.dest(buildConfig.pagesBuild))
    });
    return merge(tasks);
})

gulp.task('pack:pagesCss', function() {
    var folders = getFolders(srcConfig.pagesSource);
    var tasks = folders.map(function(folder) {
        var minifyCss = $.if(isProduction, $.minifyCss()
            .on('error', function(e) {
                console.log(e);
            }));
        return gulp.src([path.join(srcConfig.pagesSource, folder, '/*.less'), path.join(srcConfig.pagesSource, folder, '/*.css')])
            .pipe($.less())
            .pipe($.concat(folder + '.css'))
            .pipe($.autoprefixer({
                browsers: ['last 2 versions', 'ie 10']
            }))
            .pipe(minifyCss)
            .pipe(gulp.dest(buildConfig.pagesBuild));
    });
    return merge(tasks);
})


//将html模版复制过去
gulp.task('copy:pagesHtml', function() {
    return gulp.src(path.join(srcConfig.pagesSource, '/**/*.html'), {
            base: './src/'
        })
        .pipe($.rename({ dirname: '' }))
        .pipe(gulp.dest(buildConfig.pagesHtmlPath));
});

//
gulp.task('inject:pagesHtml', function() {
    var folders = getFiles(buildConfig.pagesHtmlPath, 'html');
    var options = {
        removeComments: true, //清除HTML注释
        collapseWhitespace: true, //压缩HTML
        collapseBooleanAttributes: true, //省略布尔属性的值 <input checked="true"/> ==> <input />
        removeEmptyAttributes: true, //删除所有空格作属性值 <input id="" /> ==> <input />
        removeScriptTypeAttributes: true, //删除<script>的type="text/javascript"
        removeStyleLinkTypeAttributes: true, //删除<style>和<link>的type="text/css"
        minifyJS: true, //压缩页面JS
        minifyCSS: true //压缩页面CSS
    };

    var tasks = folders.map(function(files) {
        let fileName = files.substring(0, files.lastIndexOf('.'));
        var file = gulp.src([
            path.join(buildConfig.bootstrap.css, '/**/*.css'),
            path.join(buildConfig.vendor, 'vendor.js'),
            path.join(buildConfig.appCss, 'app.css'),
            path.join(buildConfig.appJs, 'app.js'),
            path.join(buildConfig.pagesBuild, `${fileName}.css`),
            path.join(buildConfig.pagesBuild, `${fileName}.js`),
        ], { read: false })

        var htmlmin = $.if(isProduction, $.htmlmin(options)
            .on('error', function(e) {
                console.log(e);
            }));
        return gulp.src(path.join(buildConfig.pagesHtmlPath, files))
            .pipe($.inject(file, { relative: true }))
            .pipe(htmlmin)
            .pipe(gulp.dest(buildConfig.pagesHtmlPath));
    });
});





gulp.task('build', function(cb) {
    sequence('clean', ['copy:template', 'copy:res', 'copy:bootstrapCss', 'copy:bootstrapFonts', 'copy:pagesHtml'], ['pack:app', 'pack:vendor', 'pack:appCss', 'pack:pagesJs', 'pack:pagesCss'], 'inject:pagesHtml', cb);
});




gulp.task('server', ['build'], function() {
    gulp.src('./dist')
        .pipe($.webserver({
            port: config.port,
            host: config.host,
            fallback: 'index.html',
            livereload: true,
            open: true
        }));
});


gulp.task('pageHtml', function() {
    sequence('copy:pagesHtml', 'inject:pagesHtml')
});

// Default task: builds your app, starts a server, and recompiles assets when they change
gulp.task('default', ['server'], function() {
    // Watch assets
    gulp.watch(srcConfig.appJs, ['pack:app']);
    gulp.watch(srcConfig.style, ['pack:appCss']);

    // Watch pages
    gulp.watch(path.join(srcConfig.pagesSource, '/**/*.js'), ['pack:pagesJs']);
    gulp.watch([path.join(srcConfig.pagesSource, '/**/*.less'), path.join(srcConfig.pagesSource, '/**/*.css')], ['pack:pagesCss']);
    gulp.watch(path.join(srcConfig.pagesSource, '/**/*.html'), ['pageHtml']);
});