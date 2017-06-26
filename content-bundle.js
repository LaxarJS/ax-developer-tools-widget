/**
 * Copyright 2015-2017 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/* global module, require, __dirname */

const context = require.context('!!file-loader?context=' + __dirname + '/content/&name=devtools/[path][name].[ext]!./content/var/dist/', true, /\.(css|eof|js|png|svg|ttf|woff2?)(\.map)?$/);
const index = require('!!file-loader?context=' + __dirname + '/content/&name=devtools/[path][name].[ext]!./content/index.html');
const keys = context.keys();

module.exports = {
   index: index,
   scripts: keys.filter(file => (file.substr(-3) === '.js')).map(context),
   styles: keys.filter(file => (file.substr(-4) === '.css')).map(context)
};
