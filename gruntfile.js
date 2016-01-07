module.exports = function(grunt) {
    'use strict';

    grunt.loadNpmTasks('grunt-tsd');
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-nodemon');
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-concurrent");

    grunt.initConfig({
        // Typedscript defintions
        tsd: {
            install: {
                options: {
                    // execute a command
                    command: 'reinstall',

                    //optional: always get from HEAD
                    latest: true,

                    // specify config file
                    config: 'tsd.json',

                    // experimental: options to pass to tsd.API
                    opts: {
                        // props from tsd.Options
                    }
                }
            }
        },
        concurrent: {
            watchersCore: {
                tasks: ['nodemon:dev', 'watch:scripts'],
                options: {
                    logConcurrentOutput: true
                }
            },
            watchersCoreRun: {
                tasks: ['nodemon:devRun', 'watch:scripts'],
                options: {
                    logConcurrentOutput: true
                }
            },
            watchersAdminRun: {
                tasks: ['nodemon:adminRun', 'watch:scripts'],
                options: {
                    logConcurrentOutput: true
                }
            },
            watchers: {
                tasks: ['nodemon:doc', 'watch:scripts'],
                options: {
                    logConcurrentOutput: true
                }
            },
            watchersRun: {
                tasks: ['nodemon:docRun', 'watch:scripts'],
                options: {
                    logConcurrentOutput: true
                }
            }
        },
        typescript: {
            coreonly: {
                src: ["typings.d.ts", "src/**/*.ts"],
                dest: "dev/",
                options: {
                    module: "commonjs",
                    target: "es5",
                    sourceMap: true
                }
            }
        },
        nodemon: {
            dev: {
                script: 'dev/src/start.js',
                options: {
                    nodeArgs: ['--debug-brk'],
                    ignore: ['asset_src/**/*.js', 'assets/**/*.js', 'dev/src/controller/admin/*.js']
                }
            },
            devRun: {
                script: 'dev/src/start.js',
                options: {
                    nodeArgs: ['--debug'],
                    ignore: ['asset_src/**/*.js', 'assets/**/*.js', 'dev/src/controller/admin/*.js']
                }
            },
            doc: {
                script: 'dev/src/docgen.js',
                options: {
                    nodeArgs: ['--debug-brk'],
                    ignore: ['asset_src/**/*.js', 'assets/**/*.js']
                }
            },
            docRun: {
                script: 'dev/src/docgen.js',
                options: {
                    nodeArgs: ['--debug'],
                    ignore: ['asset_src/**/*.js', 'assets/**/*.js']
                }
            },
            adminRun: {
                script: 'dev/src/start.js',
                options: {
                    nodeArgs: ['--debug=7112'],
                    args: ['--admin'],
                    ignore: ['asset_src/**/*.js', 'assets/**/*.js', 'dev/src/controller/api/*.js']
                }
            }
        },
        watch: {
            scripts: {
                files: ['src/**/*.ts', '!src/views/*/*.dot', '!asset_src/**/*.*'], // the watched files
                tasks: ["typescript:coreonly"], // the task to run
                options: {
                    spawn: false // makes the watch task faster
                }
            }
        }
    });

    grunt.registerTask('install', [
        'tsd'
    ]);

    grunt.registerTask('debugCore',  [
        "typescript:coreonly",
        "concurrent:watchersCore"
    ]);

    grunt.registerTask('debugDocs',  [
        "typescript:coreonly",
        "concurrent:watchers"
    ]);

    grunt.registerTask('runCore',  [
        "typescript:coreonly",
        "concurrent:watchersCoreRun"
    ]);

    grunt.registerTask('runDocs',  [
        "typescript:coreonly",
        "concurrent:watchersRun"
    ]);

    grunt.registerTask('runAdmin',  [
        "typescript:coreonly",
        "concurrent:watchersAdminRun"
    ]);
};