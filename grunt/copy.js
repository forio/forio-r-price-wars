module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-copy');

    var htmlFileMap = [{
        expand: true,
        cwd: 'src/static/',
        src: ['*.html'],
        dest: 'web/static'
    }];

    grunt.config.set('copy', {
        model: {
            files: [{
                expand: true,
                cwd: 'src/model/dist',
                src: ['**/*.*'],
                dest: 'web/model'
            }]
        },

        static: {
            files: [{
                expand: true,
                cwd: 'src/static/',
                src: ['**/*.png', '**/*.jpg', '**/*.gif', '**/*.svg', '**/*.json', '**/*.css', '**/*.eot', '**/*.ttf', '**/*.woff', '**/*.otf', '**/*.pdf', '**/*.doc'],
                dest: 'web/static'
            }]
        },

        js: {
            files: [{
                expand: true,
                cwd: 'src/static/',
                // src: ['**/dev/**/*.js', '**/*.min.js', '**/*.map'],
                src: ['**/*.js'],
                dest: 'web/static'
            }]
        },

        html_dev: {
            files: htmlFileMap,
            options: {
                process: function (content, srcpath) {
                    return replaceMarks('DEVELOPMENT', 'PRODUCTION', content);
                }
            }
        },

        html_production: {
            files: htmlFileMap,
            options: {
                process: function (content, srcpath) {
                    return replaceMarks('PRODUCTION', 'DEVELOPMENT', content);
                }
            }
        },

        bower: {
            files: [{
                expand: true,
                cwd: 'bower_components/',
                flatten: true,
                src: [
                    'bootstrap/dist/js/bootstrap.js',
                    'd3/d3.js',
                    'jquery/dist/jquery.js',
                    'jquery-cookie/jquery.cookie.js',
                    'lodash/dist/lodash.js'
                ],
                dest: 'src/static/js/vendor/dev/',
            }, {
                flatten: true,
                expand: true,
                cwd: 'bower_components/',
                src: [
                    'backbone/backbone.js',
                    'Contour/dist/contour.js',

                    'cometd-jquery/cometd-javascript/common/src/main/js/org/cometd/cometd-header.js',
                    'cometd-jquery/cometd-javascript/common/src/main/js/org/cometd/cometd-namespace.js',
                    'cometd-jquery/cometd-javascript/common/src/main/js/org/cometd/cometd-json.js',
                    'cometd-jquery/cometd-javascript/common/src/main/js/org/cometd/Utils.js',
                    'cometd-jquery/cometd-javascript/common/src/main/js/org/cometd/TransportRegistry.js',
                    'cometd-jquery/cometd-javascript/common/src/main/js/org/cometd/Transport.js',
                    'cometd-jquery/cometd-javascript/common/src/main/js/org/cometd/RequestTransport.js',
                    'cometd-jquery/cometd-javascript/common/src/main/js/org/cometd/LongPollingTransport.js',
                    'cometd-jquery/cometd-javascript/common/src/main/js/org/cometd/CallbackPollingTransport.js',
                    'cometd-jquery/cometd-javascript/common/src/main/js/org/cometd/WebSocketTransport.js',
                    'cometd-jquery/cometd-javascript/common/src/main/js/org/cometd/Cometd.js',
                    'cometd-jquery/cometd-javascript/common/src/main/js/org/cometd/cometd-amd.js',

                    'cometd-jquery/cometd-javascript/jquery/src/main/webapp/jquery/jquery.cometd.js'

                ],
                dest: 'src/static/js/vendor/',
            }, {
                expand: true,
                cwd: 'bower_components/bootstrap/less/',
                src: ['**/*.less'],
                dest: 'src/static/css/vendor/bootstrap'
            }, {
                expand: true,
                cwd: 'bower_components/bootstrap/fonts/',
                src: ['**/*'],
                dest: 'src/static/fonts'
            }, {
                flatten: true,
                expand: true,
                cwd: 'bower_components/',
                src: ['Contour/dist/contour.css'],
                dest: 'src/static/css/vendor',
                rename: function (dest, src) {
                    return dest + '/' + src.replace('.css', '.less');
                }
            }]
        }
    });

    grunt.registerTask('copy:dev', [
        'copy:model',
        'copy:static',
        'copy:js',
        'copy:html_dev'
    ]);

    grunt.registerTask('copy:production', [
        'copy:model',
        'copy:static',
        'copy:js',
        'copy:html_production'
    ]);


    function replaceMarks(includeMark, excludeMark, content) {
        content = content.replace(markRegExp(includeMark), '$1');
        content = content.replace(markRegExp(excludeMark), '');

        return content.replace(/%TIMESTAMP%/g, Date.now());


        function markRegExp(mark) {
            return new RegExp('%' + mark + '%([^]*)%/' + mark + '%', 'g');
        }
    }
};
