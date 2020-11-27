fs = require("fs");
config = require("../config.json");


function configureFile(config, input, output) {
  let file = fs.readFileSync(input, 'utf8');
  file = replaceParams(file, "", config);
  fs.writeFileSync(output, file);
}

function replaceParams(file, root, object) {
  if (typeof object === 'string') {
    file = file.replace(new RegExp(`{${root}}`,'g'), object);
  } else {
    for (key in object) {
      file = replaceParams(file, root ? `${root}.${key}` : key, object[key]);
    }
  }
  return file;
}

const templates = "./config/templates/";

const files = "./config/files/";
if (!fs.existsSync(files)) {
  fs.mkdirSync(files);
}

for (let i = 2; i < process.argv.length; i++) {
  configureFile(config, `${templates}${process.argv[i]}`, `${files}${process.argv[i]}`);
}