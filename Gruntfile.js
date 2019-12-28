module.exports = function(grunt){
    grunt.initConfig({
        jshint: {
            options: {
                jshintrc:true     // Use external jshinrc file configured as below
            },
            all: {
                src: [
                    './*.js',
                    '.nodes/*.js'],
                filter: function(filepath) { // on some developer machines the test coverage HTML report utilities cause further failures
                    if ((filepath.indexOf("coverage/") !== -1) || (filepath.indexOf("node_modules") !== -1)) {
                        console.log( "\033[30m  filtered out \033[32m:\033[37m " + filepath + "\033[0m");
                        return false;
                    } else {
                        return true;
                    }
                }
            }
        },
        jsonlint:{
            all:{
                src:[
                    './nodes/locales/**/*.json'
                  ]
            }
        },
        inlinelint: {
            html: [
                './nodes/*.html',
                './nodes/locales/**/*.html',
            ],
            options: {
                jshintrc: ".jshintrc"
            }
        },
        simplemocha: {
            options: {
                timeout: 60000
            },
            all: { src: ['test/*_spec.js'] }
        },
        mocha_istanbul: {
            options: {
                timeout: 60000,
                ui: 'bdd',
                reportFormats: ['lcov','html'],
                print: 'both'
            },
            all: { src: ['test/*_spec.js'] }
        },
        nr_locales_htmllint: {
            all: {
              options: {
                force: false
              },
              src: [
                './nodes/locales/**/*.html'
              ]
            }
          },
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-lint-inline');
    grunt.loadNpmTasks('grunt-jsonlint');
    grunt.loadNpmTasks("grunt-simple-mocha");
    grunt.loadNpmTasks('grunt-mocha-istanbul');
    grunt.loadNpmTasks('grunt-nr-locales-htmllint');

    grunt.registerTask('default', ['jshint:all', 'jsonlint:all', 'inlinelint:html', 'nr_locales_htmllint:all', "simplemocha:all"]);
    grunt.registerTask('istanbul', ["mocha_istanbul:all"]);
};