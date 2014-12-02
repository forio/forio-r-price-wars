module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-concurrent');

    grunt.config.set('concurrent', {
        options: {
            logConcurrentOutput: true
        },
        dev: {
            tasks: [
                'watch',
                'connect'
            ]
        }
    });
};
