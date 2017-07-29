let path = require('path')



var config = {
    host: 'localhost',
    port: 8079,
    buildPath: './dist',
    sourcePath: './src'
}



var paths = {
    src: { //复制除了templates和assets/{scss,js}以外的所有内容
        appJs: [
            path.join(config.sourcePath, 'assets/js/**/*.js')
        ],
        template: [path.join(config.sourcePath, 'assets/template/**/*.html')],
        res: path.join(config.sourcePath, 'assets/res/**/*.*'),
        style: [
            path.join(config.sourcePath, 'assets/css/**/*.less'),
            path.join(config.sourcePath, 'assets/css/**/*.css')
        ],
        // bootstrap目录
        bootstrap: {
            js: 'node_modules/bootstrap/dist/js/bootstrap.min.js',
            css: [
                'node_modules/bootstrap/dist/css/bootstrap.min.css',
                'node_modules/bootstrap/dist/css/bootstrap.min.css.map'
            ],
            fonts: 'node_modules/bootstrap/dist/fonts/*.*'
        },
        //jquery目录
        jquery: 'node_modules/jquery/dist/jquery.min.js',
        // These files are for your app's JavaScript
        pagesSource: path.join(config.sourcePath, 'pages'),
    },
    build: {
        appJs: config.buildPath,
        template: path.join(config.buildPath, 'template'),
        res: config.buildPath,
        bootstrap: {
            css: path.join(config.buildPath, 'res/bootstrap/css'),
            fonts: path.join(config.buildPath, 'res/bootstrap/fonts')
        },
        vendor: config.buildPath,
        appCss: path.join(config.buildPath, 'css'),
        pagesBuild: path.join(config.buildPath, 'pages'),
        pagesHtmlPath: config.buildPath,
    }
}


module.exports = {
    config: config,
    paths: paths
}