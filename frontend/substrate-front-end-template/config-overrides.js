const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

module.exports = function override(config, env) {
  config.module.rules[1].oneOf.splice(2, 0, {
    test: /\.less$/i,
    exclude: /\.module\.(less)$/,
    use: [
      { loader: "style-loader" },
      { loader: "css-loader" },
      {
        loader: "less-loader",
        options: {
          lessOptions: {
            javascriptEnabled: true,
            sourceMap: true,
            math: "always"
          },
        },
      },
    ],
  })

  config.resolve = {
    fallback: {
      stream: require.resolve('stream-browserify'),
    },
    alias: {
      "../../theme.config": "/src/semantic-ui/theme.config",
    },
  }
  config.plugins.push(new NodePolyfillPlugin())
  return config
}
