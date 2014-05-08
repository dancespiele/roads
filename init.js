"use strict";
var mode = process.env['ROADS_ENV'] || 'dev';

var Models = require('roads-models');
require('./libs/roadsmodelpromise.js').mixin(Models.ModelRequest.prototype);

var Config = require('./base/config');
var http_server = require('roads-httpserver');
var Project = require('./base/project');
var bifocals_module = require('bifocals');

/**
 * [ description]
 * @return {[type]} [description]
 */
module.exports.bifocals = function () {
	var file_renderer = require('./libs/renderers/file_renderer');
	// move into a config somehow
	bifocals_module.addRenderer('text/css', file_renderer.get('text/css'));
	bifocals_module.addRenderer('text/javascript', file_renderer.get('text/javascript'));
	bifocals_module.addRenderer('image/png', file_renderer.get('image/png'));
	bifocals_module.addRenderer('text/html', require('./libs/renderers/handlebars_renderer'));
	bifocals_module.addRenderer('application/json', require('./libs/renderers/json_renderer'));
};

/**
 * [ description]
 * @return {[type]} [description]
 */
module.exports.config = function () {
	Config.load('server', require('./config/' + mode + '/server.json'));
	Config.load('web', require('./config/' + mode + '/web.json'));
};

/**
 * [ description]
 * @param  {[type]} onReady [description]
 * @return {[type]}         [description]
 */
module.exports.db = function (onReady) {
	return Models.Connection.connect(Config.get('server.connections'))
		.error(function (err) {
				//TODO: can we put this into the models and config somehow?
			console.log(err);
			console.log(Config.get('server.connections'));
			console.log('create database roads;');
			console.log('create user roads;');
			console.log("grant all on roads.* to roads@'localhost';");
			console.log("create table user (id int(10) unsigned not null primary key auto_increment, email varchar(256) not null, name varchar(128), password varchar (64) not null)");
			throw new Error('An error has occured when connecting to the database');
		});
};

/**
 * [assignRoute description]
 * @param  {[type]} route    [description]
 * @param  {[type]} project [description]
 * @param  {[type]} server   [description]
 * @return {[type]}          [description]
 */
function assignRoute(route, project, server) {
	console.log('assigning route ' + route);
	server.onRequest(route, function (request, view, next) {
		project.route(request, view, next);
	});
}

/**
 * [ description]
 * @param  {Function} fn [description]
 * @return {[type]}      [description]
 */
module.exports.webserver = function (fn) {
	console.log('setting up web server');

	var server = new http_server.Server({
		hostname : Config.get('server.hostname'),
		port : Config.get('server.port')          
	});

	server.onRequest('*', function (request, response, next) {
		var view = new bifocals_module.Bifocals(response);
		view.content_type = 'text/html';
		
		try {
			// allow accept headers to be in the server, and defined in the route
			if (request.headers.accept && request.headers.accept.indexOf('application/json') != -1) {
				// todo: set this somewhere else
				view.content_type = 'application/json';

				var api_templates = Project.get(Config.get('web.projects./')).dir + '/api/';
				view.setDefaultTemplate(500, api_templates + Config.get('web.templates.error'));
				view.setDefaultTemplate(404, api_templates + Config.get('web.templates.notfound'));
				view.setDefaultTemplate(401, api_templates + Config.get('web.templates.unauthorized'));
			} else {
				var templates = Project.get(Config.get('web.projects./')).dir + '/templates/';
				view.setDefaultTemplate(500, templates + Config.get('web.templates.error'));
				view.setDefaultTemplate(404, templates + Config.get('web.templates.notfound'));
				view.setDefaultTemplate(401, templates + Config.get('web.templates.unauthorized'));
			}

			view.error(view.statusError.bind(view));
			view.dir = __dirname + '/projects';

			//view.error(view.statusError.bind(view));
			console.log(request.method + ' ' + request.url.path);

			// maybe move this into server
			if (Config.get('web.cookie.domain')) {
				request.cookie.setDomain(Config.get('web.cookie.domain'));
			}
		} catch (e) {
			console.log('Failed to initalize the http request');
			console.log(e);
			view.statusError(e);
		}
			
		try {
			next(request, view);
		} catch (e) {
			view.statusError(e);
		}
	});

	var projects = Config.get('web.projects');

	for (var key in projects) {
		assignRoute(key, Project.get(projects[key]), server);
	}

	return server;
};
