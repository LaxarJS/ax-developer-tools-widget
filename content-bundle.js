/**
 * Copyright 2015-2017 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/* global module, require, __dirname */

var context = require.context(
   '!!file-loader?context=' + __dirname + '/content/&name=devtools/[path][name].[ext]!./content/var/dist/',
   true,
   /\.(css|eof|js|png|svg|ttf|woff2?)(\.map)?$/
);

var index = require(
   '!!file-loader?context=' + __dirname + '/content/&name=devtools/[path][name].[ext]!./content/index.html'
);

var keys = context.keys();

module.exports = {
   index: index,
   scripts: keys.filter( endsWith( '.js' ) ).map( context ),
   styles: keys.filter( endsWith( '.css' ) ).map( context )
};

function endsWith( ext ) {
   return function( file ) {
      return file.substr( -ext.length ) === ext; 
   };
}
