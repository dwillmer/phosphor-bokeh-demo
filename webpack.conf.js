module.exports = {
  entry: './index.js',
  output: {
    filename: './bundle.js'
  },
  resolve: {
    root: __dirname
  },
  bail: true,
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style-loader!css-loader' },
    ]
  }
}
