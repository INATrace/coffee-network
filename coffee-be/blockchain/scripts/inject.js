fs = require("fs");

let path = process.argv[2]
let mark = process.argv[3];
let injection = process.argv[4];

let str = fs.readFileSync(injection, "utf8").split('\n').join('\\n');
let file = fs.readFileSync(path, "utf8");
file = file.replace(new RegExp(`${mark}`,'g'), str);
fs.writeFileSync(path, file);