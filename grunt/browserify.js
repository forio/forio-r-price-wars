var remapify = require('remapify');
var minifyify = require('minifyify');

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-browserify');

    var appFileMap = {
        'web/static/js/app.js': ['src/static/js/app.js']
    };

    var loginFileMap = {
        'web/static/js/login-app.js': ['src/static/js/login-app.js']
    };

    var facFileMap = {
        'web/static/js/fac-app.js': ['src/static/js/fac-app.js']
    };

    var alias = [
        // './src/static/js/views/base-view.js:base-view',
        // './src/static/js/models/base-model.js:base-model',
        // './src/static/js/collections/base-collection.js:base-collection',
        // './src/static/js/routers/base-router.js:base-router',
        './src/static/js/templates.js:templates'
    ];

    var aliasMappings = [{
        cwd: 'src/static/js/views',
        src: '**/*.js',
        expose: 'views'
    }, {
        cwd: 'src/static/js/models',
        src: '**/*.js',
        expose: 'models'
    }, {
        cwd: 'src/static/js/collections',
        src: '**/*.js',
        expose: 'collections'
    }, {
        cwd: 'src/static/js/routers',
        src: '**/*.js',
        expose: 'routers'
    }, {
        cwd: 'src/static/js/config',
        src: '**/*.js',
        expose: 'config'
    }, {
        cwd: 'src/static/js/services',
        src: '**/*.js',
        expose: 'services'
    }];

    grunt.config.set('browserify', {
        options: {
            ignore: ['src/static/js/vendor/**/*.js'],

            browserifyOptions: {
                debug: true
            }
        },

        app_dev: {
            files: appFileMap,
            options: {
                alias: alias,
                preBundleCB: function (b) {
                    b.plugin(remapify, aliasMappings);
                }
            }
        },

        app_production: {
            files: appFileMap,
            options: {
                alias: alias,
                preBundleCB: function (b) {
                    b.plugin(remapify, aliasMappings);
                    b.plugin(minifyify, {
                        map: 'app.js.map',
                        output: 'web/static/js/app.js.map'
                    });
                }
            }
        },

        login_dev: {
            files: loginFileMap
        },

        login_production: {
            files: loginFileMap,
            options: {
                alias: alias,
                preBundleCB: function (b) {
                    b.plugin(remapify, aliasMappings);
                    b.plugin(minifyify, {
                        map: 'login-app.js.map',
                        output: 'web/static/js/login-app.js.map'
                    });
                }
            }
        },

        fac_dev: {
            files: facFileMap,
            options: {
                alias: alias,
                preBundleCB: function (b) {
                    b.plugin(remapify, aliasMappings);
                }
            }
        },

        fac_production: {
            files: facFileMap,
            options: {
                alias: alias,
                preBundleCB: function (b) {
                    b.plugin(remapify, aliasMappings);
                    b.plugin(minifyify, {
                        map: 'fac-app.js.map',
                        output: 'web/static/js/fac-app.js.map'
                    });
                }
            }
        },
    });

    grunt.registerTask('browserify:dev', [
        'browserify:app_dev',
        'browserify:login_dev',
        'browserify:fac_dev',
        'jshint',
        'jscs'
    ]);

    grunt.registerTask('browserify:dev_templates', [
        'browserify:app_dev',
        'browserify:login_dev',
        'browserify:fac_dev'
    ]);

    grunt.registerTask('browserify:production', [
        'browserify:app_production',
        'browserify:login_production',
        'browserify:fac_production'
    ]);
};
