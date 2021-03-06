"use strict";

/**
* build.js
* Copyright(c) 2017 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

const browserify = require('browserify');
const envify = require('envify/custom');
const fs = require('fs');

function fixExternal (external) {
	if (!external) {
		external = {};
	}

	return external;
}

function fixBabelify (babel_options) {
	if (!babel_options) {
		babel_options = {};
	}

	if (!Array.isArray(babel_options.presets)) {
		babel_options.presets = [];
	}

	babel_options.presets.push('es2015');
	return babel_options;
}

function fixExclude(exclude_list) {
	if (!exclude_list) {
		exclude_list = [];
	}

	exclude_list.push(__filename);
	exclude_list.push(__dirname + '/../integrations/koa.js');
	exclude_list.push(__dirname + '/../middleware/cors.js');
	return exclude_list;
}

function fixOptions (options) {
	if (!options) {
		options = {};
	}

	options.use_sourcemaps = options.use_sourcemaps ? true : false;

	options.babelify = fixBabelify(options.babelify);
	options.external = fixExternal(options.external);
	options.exclude = fixExclude(options.exclude);
	return options;
}

/**
 * Compiles the input_file node script to be used in the browser.
 * 
 * @param  {String} input_file  The source file that will be converted to use in the browser
 * @param  {String} output_file The output file that will be accessible by your browser
 * @param  {Object} options     A set of options that can influence the build process. See all fields below
 * @param  {Boolean} options.use_sourcemaps  Whether or not the build process should include source maps.
 * @param  {Array} options.external     An array of dependencies that should be included from exernal resources instead of built into the project
 * @param  {Object} options.envify     An object to pass to envify. This allows you to change values between your server and client scripts.
 * @param  {Array} options.exclude An array of files that should not be included in the build process.
 * @param  {Object} options.babelify An object containing parameters to pass to the babelify transform
 */
module.exports = function (input_file, output_file, options) {
	let externals = {};
	options = fixOptions(options);

	let builder = browserify(input_file, {
		debug: options.use_sourcemaps
	})
	.transform("babelify", options.babelify);

	for (let key in options.external) {
		if (options.external.hasOwnProperty(key)) {
			builder.external(key);
			externals[key] = options.external[key];
		}
	}
	
	for (let i = 0; i < options.exclude.length; i++) {
		builder.exclude(options.exclude[i]);
	}

	builder
		.transform(envify(options.envify))
		.bundle()
		.pipe(fs.createWriteStream(output_file));

	for (let key in externals) {
		if (externals.hasOwnProperty(key)) {
			browserify(null, {	
				debug: options.use_sourcemaps
			})
			.transform("babelify", options.babelify)
			.require(key)
			.bundle()
			.pipe(fs.createWriteStream(externals[key].output_file));
		}
	}
};

