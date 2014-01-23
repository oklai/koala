module.exports = function(grunt) {

    grunt.initConfig({
        nodewebkit: {
            options: {
                build_dir: './build',
                mac: true,
                win: true,
                linux32: false,
                linux64: false,
                mac_icns: './nw.icns'
            },
            // 应用路径
            src: './src/**/*'
        },
    });

    grunt.loadNpmTasks('grunt-node-webkit-builder');
    grunt.registerTask('default', ['nodewebkit']);
};
