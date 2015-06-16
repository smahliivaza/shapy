// This file is part of the Shapy project.
// Licensing information can be found in the LICENSE file.
// (C) 2015 The Shapy Team. All rights reserved.
goog.provide('shapy.browser.Texture');



/**
 * Creates a new texture.
 *
 * @constructor
 * @extends {shapy.browser.Asset}
 *
 * @param {!shapy.browser.Service} shBrowser Browser service.
 * @param {number}                 id        ID of the directory.
 * @param {=Object}                opt_data  Source data.
 */
shapy.browser.Texture = function(shBrowser, id, opt_data) {
  shapy.browser.Asset.call(
      this,
      shBrowser,
      id,
      shapy.browser.Asset.Type.TEXTURE,
      opt_data);

  /** @public {number} */
  this.width = 32;
  /** @public {number} */
  this.height = 32;
  /** @public {boolean} */
  this.dirty = true;
  /** @public {boolean} */
  this.deleted = false;

  /**
   * Raw texture data for editing.
   * @public {number}
   */
  this.data = new Uint8Array(this.width * this.height * 4);
  for (var i = 0; i < this.width * this.height * 4; ++i) {
    this.data[i] = 0xFF;
  }

  // Set preview
  this.image = (opt_data && opt_data['preview']) || '/img/logo.png';
  // Full preview
  this.imageFull = '';
};
goog.inherits(shapy.browser.Texture, shapy.browser.Asset);


/**
 * Very badass method which uses a brush to paint an object.
 *
 * @param {number} u
 * @param {number} v
 * @param {number} colour
 * @param {number} size
 */
shapy.browser.Texture.prototype.paint = function(u, v, colour, size) {
  var p = shapy.editor.geom.getPixel(u, v, this.width, this.height);

  size = Math.floor(Math.max(Math.min(10 * size / 100, 10), 1));
  for (var i = p.y - size; i <= p.y + size; ++i) {
    for (var j = p.x - size; j <= p.x + size; ++j) {
      if (i < 0 || this.width <= i || j < 0 || this.height <= j) {
        continue;
      }

      var k = i * this.width + j;
      var dx = (j - p.x) / size;
      var dy = (i - p.y) / size;
      var a = Math.max(Math.min(1.0 - Math.sqrt(dx * dx + dy * dy), 1), 0);

      var r = this.data[k * 4 + 0];
      var g = this.data[k * 4 + 1];
      var b = this.data[k * 4 + 2];

      r = r * (1 - a) + colour[0] * a;
      g = g * (1 - a) + colour[1] * a;
      b = b * (1 - a) + colour[2] * a;
      r = Math.max(Math.min(r, 255), 0);
      g = Math.max(Math.min(g, 255), 0);
      b = Math.max(Math.min(b, 255), 0);

      this.data[k * 4 + 0] = r;
      this.data[k * 4 + 1] = g;
      this.data[k * 4 + 2] = b;
    }
  }

  this.dirty = true;
};


/**
 * Loads the texture data.
 *
 * @param {Object} data
 */
shapy.browser.Texture.prototype.load = function(data) {
  // Fill in the name if unknown.
  this.name = data.name || this.shBrowser_.defaultName(this.type);
  // Fill in permission flags
  this.owner = !!data.owner;
  this.write = !!data.write;
  this.public = !!data.public;
  this.loaded = true;
  // Set full preview
  this.imageFull = data.data;

  var defer = this.shBrowser_.q_.defer();

  var image = new Image();
  image.onload = goog.bind(function() {
    this.shBrowser_.rootScope_.$apply(goog.bind(function() {
      var canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;

      var ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      this.width = image.width;
      this.height = image.height;
      this.data = new Uint8Array(
          ctx.getImageData(0, 0, image.width, image.height).data);
      this.dirty = true;
    }, this));
  }, this);
  image.src = data.data;

  return defer.promise;
};

