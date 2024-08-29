const settings = function(){
  this.root_path = __dirname;
  this.project_assets = __dirname + "/app/gulp/";

  this.settings = {
    "name": "kisphp demo",
    "root_path": this.root_path,
    "project_assets": this.project_assets,

    "js": {
      "external": {
        "sources": [
          'node_modules/jquery/dist/jquery.min.js',
          'node_modules/bootstrap/dist/js/bootstrap.min.js',
        ],
        "output_filename": "external.js",
        "output_dirname": "public/js/",
      },
      "project": {
        "sources": [
          this.project_assets + '/assets/js/app.js',
        ],
        "output_filename": "app.js",
        "output_dirname": "public/js/",
      }
    },
    "css": {
      "external": {
        "sources": [
          'node_modules/bootstrap/dist/css/bootstrap.min.css',
        ],
        "output_filename": "external.css",
        "output_dirname": "public/css/",
      },
      "project": {
        "sources": [
          this.project_assets + '/assets/css/main.css'
        ],
        "output_filename": "app.css",
        "output_dirname": "public/css/",
      }
    },
    "files": {
      "fonts": {
        "sources": [
          'node_modules/bootstrap/fonts/*.*',
        ],
        "output_dirname": "public/fonts"
      },
      "images": {
        "sources": [
          this.project_assets + '/assets/images/**/*.*'
        ],
        "output_dirname": "public/images"
      }
    }
  };

  return this.settings;
};

module.exports = settings();

