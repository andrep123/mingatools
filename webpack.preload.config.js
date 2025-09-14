module.exports = {
  mode: 'development',
  entry: './src/preload.js',
  target: 'electron-preload',
  resolve: {
    extensions: ['.js'],
  },
  node: {
    __dirname: false,
    __filename: false,
  },
};
