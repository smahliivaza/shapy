// This file is part of the Shapy project.
// Licensing information can be found in the LICENSE file.
// (C) 2015 The Shapy Team. All rights reserved.
goog.provide('shapy.HttpService');



/**
 * Intercepts failed HTTP requests.
 *
 * @constructor
 */
shapy.HttpService = function() {
};


/**
 *
 */
shapy.HttpService.prototype.request = function(request) {
  return request;
};


/**
 *
 */
shapy.HttpService.prototype.response = function(response) {
  return response;
};
