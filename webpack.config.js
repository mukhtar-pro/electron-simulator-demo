const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const commonConfig = {
  mode: "development",
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
};

// Main process config
const mainConfig = {
  ...commonConfig,
  target: "electron-main",
  entry: "./src/main/main.ts",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist/main"),
  },
};

// Preload script config
const preloadConfig = {
  ...commonConfig,
  target: "electron-preload",
  entry: "./src/preload/preload.ts",
  output: {
    filename: "preload.js",
    path: path.resolve(__dirname, "dist/preload"),
  },
};

// Renderer process config
const rendererConfig = {
  ...commonConfig,
  target: "electron-renderer",
  entry: "./src/renderer/index.tsx",
  output: {
    filename: "renderer.js",
    path: path.resolve(__dirname, "dist/renderer"),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/renderer/index.html",
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "src/assets/models",
          to: "assets/models",
          noErrorOnMissing: true,
        },
      ],
    }),
  ],
};

module.exports = [mainConfig, preloadConfig, rendererConfig];
