let path = require('path');

module.exports = {
    mode: "development",
    entry: ["./src/main.js"],
    output: {
        filename: "main.min.js",
        path: path.resolve(__dirname + "/www/js")
    }
};