module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-less');

    var fileMap = {
        'web/static/css/site.css': 'src/static/css/site.less',
        'web/static/css/facilitator.css': 'src/static/css/facilitator.less',
        // 'web/static/css/login.css': 'src/static/css/login.less'
    };

    grunt.config.set('less', {
        dev: {
            options: {
                paths: ['src/static/css']
            },
            files: fileMap
        },
        production: {
            options: {
                paths: ['src/static/css'],
                cleancss: true
            },
            files: fileMap
        }
    });
};
