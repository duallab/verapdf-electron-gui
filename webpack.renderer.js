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
      [path.resolve(__dirname, "src/common/components/layouts/pages/privacyPolicy/PrivacyPolicy.js")]: path.resolve(__dirname, 'src/common/electron/components/layouts/pages/privacyPolicy/PrivacyPolicy.js'),
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
        exclude: [
          {
              test: path.resolve(__dirname, 'node_modules'),
              exclude: [
                path.resolve(__dirname, 'node_modules/verapdf-js-viewer/node_modules/react-pdf/node_modules/pdfjs-dist'),
                path.resolve(__dirname, 'node_modules/verapdf-js-viewer/node_modules/pdfjs-dist'),
                path.resolve(__dirname, 'node_modules/verapdf-js-viewer/dist'),
                path.resolve(__dirname, 'node_modules/pdfjs-dist'),
                path.resolve(__dirname, 'node_modules/react-arborist')
              ]
          }
        ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-optional-chaining']
          }
        }
      },
    ],
  },
};