// This file is part of the Shapy project.
// Licensing information can be found in the LICENSE file.
// (C) 2015 The Shapy Team. All rights reserved.
goog.provide('shapy.editor.module');



/**
 * @controller
 */
shapy.editor.EditorController = function() {
};



/**
 * @public {Object}
 * @const
 */
shapy.editor.module = angular
  .module('shEditor', [])
  .controller('EditorController', shapy.editor.EditorController);
