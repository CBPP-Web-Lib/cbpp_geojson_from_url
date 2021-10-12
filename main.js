
var request = require("request");
var fs = require("fs");
var unzipper = require("unzipper");
var ogr2ogr = require("ogr2ogr").default;

module.exports = geojson_from_url;

function make_directory(path) {
  try {
    fs.mkdirSync(path);
  } catch (ex) {
    //console.log(ex);
  };
}

function geojson_from_url(url, cb) {
  make_directory("./zip");
  var file = url.split("/");
  file = file[file.length - 1];
  var name = file.split(".");
  name.pop();
  name = name.join(".");
  RequestMaker(url,"./zip").then(function() {
    unzip_file(name)
  }).then(function() {
    Shp2GeoJSONConvertor(name)
  }).then(function() {
    if (typeof(cb)==="function") {cb();}
  });
}

var RequestMaker = function(f, dest, j) {
  make_directory("./zip");
  return new Promise(function(resolve, reject) {
    try {
      var filename = f.split("/")[f.split("/").length - 1];
      if (fs.existsSync(dest + "/" + filename)) {
        console.log("file exists " + f);
        resolve(j);
      } else {
        var ws = fs.createWriteStream(dest + "/" +  filename);
        request(f)
          .pipe(ws);
        ws.on("finish", function() {
          console.log("finished downloading " + f);
          resolve(j);
        });
      }
    } catch (ex) {
      console.log(ex);
      reject(ex);
    }
  });
};

var Shp2GeoJSONConvertor = function(f, cb) {
  make_directory("./geojson");
  return new Promise(function(resolve, reject) {
    try {
      if (fs.existsSync("./geojson/" + f + ".json")) {
        resolve();
      } else {
        ogr2ogr('./shp/' + f + "/" + f + ".shp", {
          format:"GeoJSON",
          timeout: 600000
        }).exec((err, data)=> {
          if (data) {
            fs.writeFileSync("./geojson/" + f + ".json", JSON.stringify(data.data), "utf-8");
          }
          resolve();
        })
      }
    } catch (ex) {
      console.log(ex);
      reject(ex);
    }
  });
}

var unzip_file = function(file) {
  return new Promise((resolve, reject) => {
    make_directory("./shp");
    if (fs.existsSync("./shp/" + file)) {resolve();}
    else {
      fs.createReadStream("./zip/" + file + ".zip")
        .pipe(unzipper.Extract({
          path: './shp/' + file
        }).on("close", resolve));
    }
  });
};
