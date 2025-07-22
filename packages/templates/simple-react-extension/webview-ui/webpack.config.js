const path = require('path');

module.exports = {
  target: 'web', // Target web environment for webview
  entry: './src/index.tsx',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      // Disable Node.js polyfills for webview
      "fs": false,
      "path": false,
      "crypto": false,
      "stream": false,
      "util": false,
      "buffer": false,
      "process": false
    }
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'build'),
    clean: true
  },
  externals: {
    vscode: 'commonjs vscode'
  },
  optimization: {
    minimize: false, // Disable minification for easier debugging
  },
  devtool: 'source-map'
};
