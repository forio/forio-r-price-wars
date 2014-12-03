module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-template-module');

    grunt.config.set('template-module', {
        compile: {
            options: {
                module: true,
                provider: 'lodash',
                requireProvider: false,
                processName: function (filename) {
                    return filename
                        .replace(/src\/static\/templates\//i, '')
                        .replace('.html', '')
                        .toLowerCase();
                }
            },
            files: {
                'src/static/js/templates.js': [
                    'src/static/templates/**/*.html'
                ]
            }
        }
    });

    grunt.registerTask('templates', [
        'template-module:compile'
    ]);
};
