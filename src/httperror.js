"use strict";
/**
 * httperror.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * Exposes an HTTP error class to simplify handling errors that are associated with HTTP response statuses 
 */

 /**
  * 
  * @name HttpError
  */
module.exports = class HttpError extends Error {
	/**
	 * 
	 * @param {string} body - The HTTP response body
	 * @param {number} [status] - The HTTP response status code
	 * @param {object} [headers] - Any custom HTTP response headers
	 */
	constructor(body, status, headers) {
		super();
		this.message = body;
		this.code = status ? status : module.exports.internal_server_error;
		this.headers = headers ? headers : {};

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, HttpError);
		} else {
			// FF doesn't support captureStackTrace
			this.stack = (new Error()).stack;
		}
	}
};

module.exports.invalid_request = 400;
module.exports.unauthorized = 401;
module.exports.forbidden = 403;
module.exports.not_found = 404;
module.exports.method_not_allowed = 405;
module.exports.not_acceptable = 406;
module.exports.conflict = 409;
module.exports.gone = 410;
module.exports.unprocessable_entity = 422;
module.exports.too_many_requests = 429;

module.exports.internal_server_error = 500;