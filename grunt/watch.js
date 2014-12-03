module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.config.set('watch', {
        options: {
            interrupt: true
        },

        grunt: {
            options: {
                reload: true
            },
            files: [
                'Gruntfile.js',
                'grunt/*.js'
            ],
            tasks: ['dev_tasks']
        },

        // templates: {
        //     files: [
        //         'src/static/templates/**/*.html'
        //     ],
        //     tasks: ['template-module:compile', 'browserify:dev_templates', 'notify:build']
        // },

        copy_model: {
            files: [
                'src/model/dist/*'
            ],
            tasks: ['copy:model', 'notify:build']
        },

        copy_static: {
            files: [
                'src/static/img/**/*.*'
            ],
            tasks: ['copy:static', 'notify:build']
        },

        // copy_js: {
        //     files: [
        //         'src/static/js/vendor/dev/**/*.js',
        //         'src/static/js/**/*.min.js'
        //     ],
        //     tasks: ['copy:js_dev', 'notify:build']
        // },

        copy_html: {
            files: [
                'src/static/**/*.html',
                '!src/static/templates/**/*.html'
            ],
            tasks: ['copy:html_dev', 'notify:build']
        },

        less: {
            files: [
                'src/static/css/**/*.less'
            ],
            tasks: ['less:dev', 'notify:build']
        },

        // uglify: {
        //     files: [
        //         'src/static/js/vendor/backbone.js',
        //         'src/static/js/vendor/forio/backbone.calculated.js',
        //         'src/static/js/vendor/**/*.js',
        //         '!src/static/js/vendor/dev/**/*.js',
        //         '!src/static/js/vendor/**/*.min.js'
        //     ],
        //     tasks: ['uglify:dev']
        // },

        browserify: {
            files: [
                'src/static/js/**/*.js',
                '!src/static/js/templates.js',
                '!src/static/js/vendor/**/*.js'
            ],
            tasks: ['browserify:dev', 'notify:build']
        }
    });
};
