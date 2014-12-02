module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-jscs');

    grunt.config.set('jscs', {
        options: {
            config: '.jscsrc'
        },
        all: {
            src: [
                'src/static/js/**/*.js',
                '!src/static/js/vendor/**/*.js',
                '!src/static/js/templates.js'
            ]
        }
    });
};
