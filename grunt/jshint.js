module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.config.set('jshint', {
        options: {
            jshintrc: true
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
