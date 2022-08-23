const path = require('path');

module.exports = {
  resolve: {
    alias: {
      [path.resolve(__dirname, "src/common/services/fileService.js")]: path.resolve(__dirname, 'src/common/electron/services/fileService.js'),
      [path.resolve(__dirname, "src/common/services/jobService.js")]: path.resolve(__dirname, 'src/common/electron/services/jobService.js'),
      [path.resolve(__dirname, "src/common/services/pdfStorage.js")]: path.resolve(__dirname, 'src/common/electron/services/pdfStorage.js'),
      [path.resolve(__dirname, "src/common/services/profiles.js")]: path.resolve(__dirname, 'src/common/electron/services/profiles.js'),
      [path.resolve(__dirname, "src/common/services/workerService.js")]: path.resolve(__dirname, 'src/common/electron/services/workerService.js'),
      [path.resolve(__dirname, "src/common/components/layouts/pages/about/About.js")]: path.resolve(__dirname, 'src/common/electron/components/layouts/pages/about/About.js'),
    }
  },
  module: {
    rules: [
      {
        test: /\.md$/,
        use: 'raw-loader'
      },
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader'
        }
      },
    ],
  },
};