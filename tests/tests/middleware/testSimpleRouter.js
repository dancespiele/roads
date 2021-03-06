"use strict";

const url_module = require('url');
const SimpleRouter = require('../../../index.js').middleware.SimpleRouter;
const buildRouter = function buildRouter() {
	return new SimpleRouter();
};

const router_file_test_path = __dirname + '/../../resources/_router_file_test.js';

const buildMockRoad = function buildMockRoad() {
	return {
		addRouteArgs: [],
		useArgs: [],
		contextValues: {},
		use: function () {
			this.useArgs.push(Array.prototype.slice.call(arguments)[0]);
		},
		request: function (index) {
			return this.useArgs[index].apply(this, Array.prototype.slice.call(arguments, 1));
		}
	};
};

/**
 * 
 */
exports['test addRoute adds values to the list of routes in the right format'] = function (test) {
	let router = buildRouter();
	let path = '/';
	let method = 'GET';
	let fn = () => {};

	router.addRoute(method, path, fn);
	test.deepEqual({
		path: path,
		method: method,
		fn: fn
	}, router.routes[0]);

	test.done();
};

/**
 * 
 */
exports['test addRoute adds middleware to the route'] = function (test) {
	let mockRoad = buildMockRoad();
	let router = buildRouter();
	router.applyMiddleware(mockRoad);

	test.equal(1, mockRoad.useArgs.length);
	test.done();
};

/**
 * 
 */
exports['test middleware function routes successfully to successful routes'] = function (test) {
	let router = buildRouter();
	let path = '/';
	let method = 'GET';
	let route_hit = false;
	let fn = () => {
		route_hit = true;
	};

	router.addRoute(method, path, fn);
	router.middleware(router.routes, method, url_module.parse(path), {}, {}, () => {});

	test.equal(true, route_hit);
	test.done();
};

/**
 * 
 */
exports['test middleware function routes successfully to successful routes only once when there may be more than one route'] = function (test) {
	let router = buildRouter();
	let path = '/';
	let method = 'GET';
	let route_hit = false;
	let fn = () => {
		route_hit = true;
	};

	let fn2 = () => {
		route_hit = false;
	};

	router.addRoute(method, path, fn);
	router.addRoute(method, path, fn2);
	router.middleware(router.routes, method, url_module.parse(path), {}, {}, () => {});

	test.equal(true, route_hit);
	test.done();
};

/**
 * 
 */
exports['test middleware function routes to next  on a missed url'] = function (test) {
	let router = buildRouter();
	let path = '/';
	let method = 'GET';
	let route_hit = false;
	let next_hit = false;
	let fn = () => {
		route_hit = true;
	};

	router.addRoute("/foo", method, fn);
	router.middleware(router.routes, method, url_module.parse(path), {}, {}, () => {
		next_hit = true;
	});

	test.equal(false, route_hit);
	test.equal(true, next_hit);
	test.done();
};

/**
 * 
 */
exports['test middleware function routes to next on a missed http method but matching url'] = function (test) {
	let router = buildRouter();
	let path = '/';
	let method = 'GET';
	let route_hit = false;
	let next_hit = false;
	let fn = () => {
		route_hit = true;
	};

	router.addRoute(path, "PUT", fn);
	router.middleware(router.routes, method, url_module.parse(path), {}, {}, () => {
		next_hit = true;
	});

	test.equal(false, route_hit);
	test.equal(true, next_hit);
	test.done();
};

/**
 * 
 */
exports['test route function gets the proper context and arguments'] = function (test) {
	let router = buildRouter();
	let path = '/';
	let method = 'GET';
	let body = {harvey: 'birdman'};
	let headers = {bojack: 'horseman'};

	router.addRoute(method, path, (request_url, request_body, request_headers) => {
		test.deepEqual(url_module.parse(path), request_url);
		test.equal(body, request_body);
		test.equal(headers, request_headers);
		test.done();
	});

	router.middleware(router.routes, method, url_module.parse(path), body, headers, () => {});
};

/**
 * 
 */
exports['test route that throws an exception is handled properly'] = function (test) {
	let router = buildRouter();
	let path = '/';
	let method = 'GET';
	let error_message = "blah blah blah";
	let fn = () => {
		throw new Error(error_message);
	};

	router.addRoute(method, path, fn);
	try {
		router.middleware(router.routes, method, url_module.parse(path), {}, {}, () => {});
	} catch (error) {
		test.ok(error instanceof Error);
		test.equal(error_message, error.message);
		test.done();
	}
};

/**
 * 
 */
exports['test route successfully returns value out of the middleware'] = function (test) {
	let router = buildRouter();
	let path = '/';
	let method = 'GET';
	let route_hit = false;
	let fn = () => {
		return 'route';
	};

	router.addRoute(method, path, fn);
	route_hit = router.middleware(router.routes, method, url_module.parse(path), {}, {}, () => {});

	test.equal('route', route_hit);
	test.done();
};

/**
 * 
 */
exports['test next successfully returns value out of the middleware'] = function (test) {
	let router = buildRouter();
	let path = '/';
	let method = 'GET';
	let route_hit = false;
	let fn = () => {
		return true;
	};

	router.addRoute(path, 'PUT', fn);
	route_hit = router.middleware(router.routes, method, url_module.parse(path), {}, {}, () => {
		return 'next';
	});

	test.equal('next', route_hit);
	test.done();
};

/**
 * 
 */
exports['test applyMiddleware can call the middleware properly'] = function (test) {
	let mockRoad = buildMockRoad();
	let router = buildRouter();
	router.applyMiddleware(mockRoad);

	let path = '/';
	let method = 'GET';
	let route_hit = false;
	let fn = () => {
		route_hit = 'route';
	};

	router.addRoute(method, path, fn);
	mockRoad.request(0, method, url_module.parse(path), {}, {}, () => {});

	test.equal('route', route_hit);
	test.done();
};

/**
 * 
 */
exports['test routes with query params route properly'] = function (test) {
	let mockRoad = buildMockRoad();
	let router = buildRouter();
	router.applyMiddleware(mockRoad);

	let path = '/';
	let method = 'GET';
	let route_hit = false;
	let fn = () => {
		route_hit = 'route';
	};

	router.addRoute(method, path, fn);
	mockRoad.request(0, method, url_module.parse(path + '?foo=bar'), {}, {}, () => {});

	test.equal('route', route_hit);
	test.done();
};

exports['test routes loaded from a file'] = function (test) {
	let mockRoad = buildMockRoad();
	let router = buildRouter();
	router.applyMiddleware(mockRoad);

	router.addRouteFile(router_file_test_path);

	Promise.all([
		mockRoad.request(0, 'GET', url_module.parse('/'), {}, {}, () => {}),
		mockRoad.request(0, 'POST', url_module.parse('/'), {}, {}, () => {}),
		mockRoad.request(0, 'GET', url_module.parse('/test'), {}, {}, () => {}),
		//Bad Method
		mockRoad.request(0, 'POST', url_module.parse('/test'), {}, {}, () => {}),
		//Bad Path
		mockRoad.request(0, 'GET', url_module.parse('/fakeurl'), {}, {}, () => {})
	]).then(results => {
		test.equal(results[0], 'root get successful');
		test.equal(results[1], 'root post successful');
		test.equal(results[2], 'test get successful');

		test.equal(results[3], undefined);

		test.equal(results[4], undefined);

		test.done();
	});	
};


exports['test routes loaded from a file with prefix'] = function (test) {
	let mockRoad = buildMockRoad();
	let router = buildRouter();
	router.applyMiddleware(mockRoad);

	router.addRouteFile(router_file_test_path, '/test_prefix');

	Promise.all([
		mockRoad.request(0, 'GET', url_module.parse('/test_prefix'), {}, {}, () => {}),
		mockRoad.request(0, 'POST', url_module.parse('/test_prefix'), {}, {}, () => {}),
		mockRoad.request(0, 'GET', url_module.parse('/test_prefix/test'), {}, {}, () => {}),
		//Bad Method
		mockRoad.request(0, 'POST', url_module.parse('/test_prefix/test'), {}, {}, () => {}),
		//Bad Path
		mockRoad.request(0, 'GET', url_module.parse('/test_prefix/fakeurl'), {}, {}, () => {})
	]).then(results => {
		test.equal(results[0], 'root get successful');
		test.equal(results[1], 'root post successful');
		test.equal(results[2], 'test get successful');

		test.equal(results[3], undefined);

		test.equal(results[4], undefined);

		test.done();
	});	
};