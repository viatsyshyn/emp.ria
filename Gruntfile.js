/*
 * emp.ria-grunt-jsbuild3
 * https://code.google.com/p/emp-ria/
 *
 * Copyright (c) 2013 Volodymyt Iatsyshyn
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path');

module.exports = function(grunt) {

  var build_number = grunt.option("build") || '0';
  var build_tag = grunt.option("tag") || '0.0';

  var pkg = grunt.file.readJSON('package.json');
  pkg.version = build_tag || pkg.version;

  // Project configuration.
  grunt.initConfig({
    pkg: pkg,
    jshint: {
      all: [
        'Gruntfile.js',
        '**/*.js',
      ],
      options: {
        jshintrc: '.jshintrc',
      },
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp'],
    },

    replace: {
      version: {
        src: 'package.json',               // source files array (supports minimatch)
        dest: 'package.json',              // destination directory or file
        replacements: [{
          from: '0.0.0',                   // string replacement
          to: pkg.version
        }]
      }
    },

    jstestdriver: {
      options: {
        configPath: 'test/JsTestDriver.conf'
      },

      all: {
        files: [{
          expand: true,
          src: ['test/*.jstd']
        }]
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-text-replace');

  grunt.registerMultiTask('jstestdriver', function () {
    var done = this.async();

    done();
  });

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);
};
