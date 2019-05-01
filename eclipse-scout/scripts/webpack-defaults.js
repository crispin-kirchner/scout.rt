/*******************************************************************************
 * Copyright (c) 2014-2019 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 ******************************************************************************/
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const exec = require('child_process').exec;
const path = require('path');
const webpack = require('webpack');
const scoutBuild = require('./constants');

module.exports = (env, args) => {
  const devMode = args.mode !== scoutBuild.mode.production;
  const jsFilename = devMode ? '[name].js' : '[name]-[contenthash].min.js';
  const cssFilename = devMode ? '[name].css' : '[name]-[contenthash].min.css';
  const outSubDir = devMode ? scoutBuild.outSubDir.development : scoutBuild.outSubDir.production;
  console.log(`Webpack mode: ${args.mode}`);

  return {
    target: 'web',
    mode: 'none',
    devtool: devMode ? 'inline-module-source-map' : undefined,
    entry: {
      'eclipse-scout': './index.js',
      'scout-theme': './src/scout/scout-theme.less',
      'scout-theme-dark': './src/scout/scout-theme-dark.less'
    },
    output: {
      filename: jsFilename,
      path: path.resolve(scoutBuild.outDir, outSubDir)
    },
    performance: {
      hints: false
    },
    module: {
      // LESS
      rules: [{
        test: /\.less$/,
        use: [{
          // Extracts CSS into separate files. It creates a CSS file per JS file which contains CSS.
          // It supports On-Demand-Loading of CSS and SourceMaps.
          // see: https://webpack.js.org/plugins/mini-css-extract-plugin/
          //
          // Note: this creates some useless *.js files, like dark-theme.js
          // This seems to be an issue in webpack, workaround is to remove the files later
          // see: https://github.com/webpack-contrib/mini-css-extract-plugin/issues/151
          // seems to be fixed in webpack 5, workaround to manually delete js files can be removed as soon as webpack 5 is released
          loader: MiniCssExtractPlugin.loader
        }, {
          // Interprets @import and url() like import/require() and will resolve them.
          // see: https://webpack.js.org/loaders/css-loader/
          loader: 'css-loader',
          options: {
            sourceMap: devMode,
            modules: false, // We don't want to work with CSS modules
            url: false      // Don't resolve URLs in LESS, because relative path does not match /res/fonts
          }
        }, {
          // Compiles Less to CSS.
          // see: https://webpack.js.org/loaders/less-loader/
          loader: 'less-loader',
          options: {
            sourceMap: devMode
          }
        }]
      }, {
        // # Babel
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            compact: false,
            sourceMaps: devMode ? 'inline' : undefined,
            plugins: ['@babel/plugin-transform-object-assign', '@babel/proposal-class-properties', '@babel/proposal-object-rest-spread'],
            presets: [
              ['@babel/preset-env', {
                debug: false,
                targets: {
                  firefox: '35',
                  chrome: '40',
                  ie: '11',
                  edge: '12',
                  safari: '8'
                }
              }]
            ]
          }
        }
      }]
    },
    plugins: [
      // see: extracts css into separate files
      new MiniCssExtractPlugin({
        filename: cssFilename
      }),
      // see: https://webpack.js.org/guides/output-management/#cleaning-up-the-dist-folder
      new CleanWebpackPlugin(),
      // run post-build script hook
      {
        apply: (compiler) => {
          compiler.hooks.afterEmit.tap('AfterEmitPlugin', (compilation) => {
            exec('node ' + __dirname + '/post-build.js ' + args.mode, (err, stdout, stderr) => {
              if (err) throw err;
              if (stdout) process.stdout.write(stdout);
              if (stderr) process.stderr.write(stderr);
            });
          });
        }
      },
      // # Copy resources
      new CopyPlugin([{
        // # Copy static web-resources
        from: 'res',
        to: '../res/'
      }]),
      // Shows progress information in the console
      new webpack.ProgressPlugin()
    ],
    optimization: {
      minimizer: [
        // minify css
        new OptimizeCssAssetsPlugin({
          assetNameRegExp: /\.min\.css$/g,
          cssProcessorPluginOptions: {
            preset: ['default', {discardComments: {removeAll: true}}],
          },
        }),
        // minify js
        new TerserPlugin({
          test: /\.js(\?.*)?$/i,
          sourceMap: devMode,
          cache: true,
          parallel: true
        })
      ]
    }
  };
};
