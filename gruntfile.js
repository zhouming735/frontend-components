module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      dist: {
        src: ['./dist']
      }
    },
    jshint: {
      options: {
        evil: true
      },
      vsko_js: ['./src/vs-ko/js/vsMask.js', './src/vs-ko/js/vsWin.js', './src/vs-ko/js/vsCalendar.js'
        , './src/vs-ko/js/vsPage.js', './src/vs-ko/js/vsGrid.js', './src/vs-ko/js/vsAutoComplete.js'
        , './src/vs-ko/js/vsTreeSelector.js', './src/vs-ko/js/vsMemberSelector.js'
        , './src/vs-ko/js/vsTeamMemberSelector.js', './src/vs-ko/js/vsTeamMemberOneSelector.js'],
      vsrsa_js:['./src/vs-rsa/base64.js','./src/vs-rsa/jsbn.js','./src/vs-rsa/rng.js','./src/vs-rsa/rsa.js'],
      vsmap_js:['./src/vs-map/vsMap.js']
    },
    copy: {
      vsko_image: {
        files: [
          { expand: true, cwd: './src/vs-ko/css/images/', src: ['*.{png,jpg,jpeg,gif}'], dest: './dist/vs-ko/css/images' }
        ]
      },
      vsko_tpl: {
        files: [
          { expand: true, cwd: './src/vs-ko/tpl/', src: ['*'], dest: './dist/vs-ko/tpl' }
        ]
      }
    },
    concat: {
      vsko_css: {
        src: ['./src/vs-ko/css/vsMask.css', './src/vs-ko/css/vsWin.css', './src/vs-ko/css/vsCalendar.css'
          , './src/vs-ko/css/vsPage.css', './src/vs-ko/css/vsGrid.css', './src/vs-ko/css/vsAutoComplete.css'
          , './src/vs-ko/css/vsTreeSelector.css', './src/vs-ko/css/vsMemberSelector.css'
          , './src/vs-ko/css/vsTeamMemberSelector.css', './src/vs-ko/css/vsTeamMemberOneSelector.css'],
        dest: './dist/vs-ko/css/vs-ko.css'
      },
      vsko_js: {
        src: ['./src/vs-ko/js/vsMask.js', './src/vs-ko/js/vsWin.js', './src/vs-ko/js/vsCalendar.js'
          , './src/vs-ko/js/vsPage.js', './src/vs-ko/js/vsGrid.js', './src/vs-ko/js/vsAutoComplete.js'
          , './src/vs-ko/js/vsTreeSelector.js', './src/vs-ko/js/vsMemberSelector.js'
          , './src/vs-ko/js/vsTeamMemberSelector.js', './src/vs-ko/js/vsTeamMemberOneSelector.js'],
        dest: './dist/vs-ko/js/vs-ko.js'
      },
      vsrsa_js:{
        src: ['./src/vs-rsa/base64.js','./src/vs-rsa/jsbn.js','./src/vs-rsa/rng.js','./src/vs-rsa/rsa.js'],
        dest: './dist/vs-rsa/vs-rsa.js'
      },
      vsmap_js:{
        src: ['./src/vs-map/vsMap.js'],
        dest: './dist/vs-map/vs-map.js'
      }
    },
    uglify: {
      compress_vsko_js: {
        src: ['./dist/vs-ko/js/vs-ko.js'],
        dest: './dist/vs-ko/js/vs-ko.min.js'
      },
      compress_vsrsa_js: {
        src: ['./dist/vs-rsa/vs-rsa.js'],
        dest: './dist/vs-rsa/vs-rsa.min.js'
      },
      compress_vsmap_js: {
        src: ['./dist/vs-map/vs-map.js'],
        dest: './dist/vs-map/vs-map.min.js'
      }
    },
    cssmin: {
      compress_vsko_css: {
        src: ['./dist/vs-ko/css/vs-ko.css'],
        dest: './dist/vs-ko/css/vs-ko.min.css'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.registerTask('default', ['clean','jshint', 'copy', 'concat', 'uglify', 'cssmin']);
};