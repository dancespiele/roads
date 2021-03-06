"use strict";
/**
* applyPublicRoutes.js
* Copyright(c) 2017 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var roads = require('../../../index');
var fs = require('fs');

/**
 * [one description]
 * @type {Resource}
 */
module.exports = function (router) {
	router.addRoute('GET', '/', function () {
		this.setTitle('Root Resource');
		// In the real world the body of the response should be created from a template engine.
		return new this.Response('Hello!<br /> Try the <a href="/public" data-roads="link">public test link</a>. It\'s available to the server and can be rendered from the client! Try clicking it for the client path, or control clicking for the server.<br />\
Try the <a href="/private">private test link</a>. It\'s available to the server, but is not build in the client! Check your console for proof of the 404!');
	});

	router.addRoute('GET', 'client.brws.js', function (url, body, headers) {
		this.ignore_layout = true;
		// In the real world the body of the response should be created from a template engine.
		return new this.Response(fs.readFileSync(__dirname + '/../static/client.brws.js').toString('utf-8'), 200, {
			'Content-Type': 'application/json; charset=UTF-8'
		});
	});

	router.addRoute('GET', 'client.map.json', function (url, body, headers) {
		// In the real world the body of the response should be created from a template engine.
		return new this.Response(fs.readFileSync(__dirname + '/../static/client.map.json').toString('utf-8'), 200, {
			'Content-Type': 'application/json; charset=UTF-8'
		});
	});

	router.addRoute('GET', 'public', function () {
		this.setTitle('Public Resource');
		console.log('Here are all cookies accessible to this code: ', this.cookies);
		console.log("Cookies are not set until you access the private route.");
		console.log("Notice that the http only cookies do not show in your browser's console.log");
		return new this.Response('Hello!<br /> The page you are looking at can be renderd via server or client. The landing page can too, so try going back <a href="/" data-roads="link">home</a>!<br />');
	});
};