// This file is part of the Shapy project.
// Licensing information can be found in the LICENSE file.
// (C) 2015 The Shapy Team. All rights reserved.
goog.provide('shapy.browser.Asset');
goog.provide('shapy.browser.Asset.Dir');
goog.provide('shapy.browser.Asset.Scene');
goog.provide('shapy.browser.Asset.Texture');




/**
 * Class representing an asset.
 *
 * @constructor
 *
 * @param {number} id    Id of the asset.
 * @param {string} type  Type of the asset.
 * @param {string} name  Name of the asset.
 * @param {string} image Path to image to be displayed for asset in browser.
 */
shapy.browser.Asset = function(id, name, type, image) {
  /**
   * Id of the asset.
   * @public {number}
   * @const
   */
  this.id = id;

  /**
   * Name of the asset.
   * @public {string}
   * @const
   */
  this.name = name;

  /**
   * Type of the asset.
   * @public {string}
   * @const
   */
  this.type = type;

  /**
   * Path to image to be displayed for asset in browser.
   * @public {string}
   * @const
   */
  this.image = image;
};


/**
 * Creates an asset representing a directory.
 *
 * @constructor
 * @extends {shapy.browser.Asset}
 *
 * @param {number} id    Id of the asset.
 * @param {string} name  Name of the asset.
 * @param {Array.<shapy.browser.Asset.Dir>} parent Parent dir of this dir.
 */
shapy.browser.Asset.Dir = function(id, name, parent) {
  shapy.browser.Asset.call(this, id, name, 'dir', '/img/folder.png');

  /**
   * Parent directory of this directory.
   * @public {shapy.browser.Asset.Dir}
   * @const
   */
  this.parent = parent;

  /**
   * Subdirectories of this directory.
   * @public {Array.<shapy.browser.Asset.Dir>}
   * @const
   */
  this.subdirs = [];

  // Update parent's subdir
  if (parent !== null) {
    parent.subdirs.push(this);
  }
};
goog.inherits(shapy.browser.Asset.Dir, shapy.browser.Asset);



/**
 * Creates an asset representing a scene.
 *
 * @constructor
 * @extends {shapy.browser.Asset}
 *
 * @param {number} id    Id of the asset.
 * @param {string} name  Name of the asset.
 * @param {string} image Path to image to be displayed for asset in browser.
 */
shapy.browser.Asset.Scene = function(id, name, image) {
  shapy.browser.Asset.call(this, id, name, 'scene', image);
};
goog.inherits(shapy.browser.Asset.Scene, shapy.browser.Asset);



/**
 * Creates an asset representing a texture.
 *
 * @constructor
 * @extends {shapy.browser.Texture}
 *
 * @param {number} id    Id of the asset.
 * @param {string} name  Name of the asset.
 * @param {string} image Path to image to be displayed for asset in browser.
 */
shapy.browser.Asset.Texture = function(id, name, image) {
  shapy.browser.Asset.call(this, id, name, 'texture', image);
};
goog.inherits(shapy.browser.Asset.Texture, shapy.browser.Asset);




