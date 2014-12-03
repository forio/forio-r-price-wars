module.exports = function (grunt) {
    require('time-grunt')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
    });

    grunt.file.expand('grunt/*.js').forEach(function (task) {
        require('./' + task)(grunt);
    });

    grunt.registerTask('dev_tasks', [
        'clean',
        'templates',
        'less:dev',
        // 'uglify:dev',
        'browserify:dev',
        'copy:dev',
        'notify:build'
    ]);

    grunt.registerTask('dev', [
        // 'copy:bower',
        'jshint',
        'jscs',
        'dev_tasks',
        'concurrent'
    ]);

    grunt.registerTask('production_tasks', [
        'clean',
        'templates',
        'less:production',
        // 'uglify:production',
        'browserify:production',
        'copy:production'
    ]);

    grunt.registerTask('production', [
        'jshint',
        'jscs',
        // 'copy:bower',
        'production_tasks'
    ]);

    grunt.registerTask('default', [
        'dev'
    ]);
};
