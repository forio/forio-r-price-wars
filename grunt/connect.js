module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-connect');

    grunt.config.set('connect', {
        server: {
            options: {
                base: 'web/static',
                port: 8082,
                keepalive: true
            }
        }
    });
};
