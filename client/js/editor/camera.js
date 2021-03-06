// This file is part of the Shapy project.
// Licensing information can be found in the LICENSE file.
// (C) 2015 The Shapy Team. All rights reserved.
goog.provide('shapy.editor.Camera');
goog.provide('shapy.editor.Camera.Ortho');
goog.provide('shapy.editor.Camera.Persp');

goog.require('goog.vec.Mat4');
goog.require('goog.vec.Ray');
goog.require('goog.vec.Vec3');



/**
 * Camera class.
 *
 * @constructor
 */
shapy.editor.Camera = function() {
  /** @public {!goog.vec.Mat4} @const */
  this.proj = goog.vec.Mat4.createFloat32();
  /** @public {!goog.vec.Mat4} @const */
  this.invProj = goog.vec.Mat4.createFloat32();
  /** @public {!goog.vec.Mat4} @const */
  this.view = goog.vec.Mat4.createFloat32();
  /** @public {!goog.vec.Mat4} @const */
  this.invView = goog.vec.Mat4.createFloat32();
  /** @public {!goog.vec.Mat4} @const */
  this.vp = goog.vec.Mat4.createFloat32();
  /** @public {!goog.vec.Vec3} @const */
  this.up = goog.vec.Vec3.createFloat32FromValues(0, 1, 0);
  /** @public {!goog.vec.Vec3} @const */
  this.eye = goog.vec.Vec3.createFloat32FromValues(8, 8, 8);
  /** @public {!goog.vec.Vec3} @const */
  this.center = goog.vec.Vec3.createFloat32FromValues(0, 0, 0);
  /** @public {number} */
  this.aspect = 16.0 / 9.0;
};


/**
 * Recomputes the matrices.
 */
shapy.editor.Camera.prototype.compute = goog.abstractMethod;


/**
 * Resize the camera, usually affects aspect ratio of cameras.
 *
 * @param {number} w
 * @param {number} h
 */
shapy.editor.Camera.prototype.resize = function(w, h) {
  this.aspect = w / h;
};


/**
 * Returns the ray that corresponds to a screen coordinate.
 *
 * @param {number} x
 * @param {number} y
 *
 * @return {goog.vec.Ray.Type}
 */
shapy.editor.Camera.prototype.raycast = function(x, y) {
  var x0 = goog.vec.Vec4.createFloat32FromValues(x, y, -1, 1);
  goog.vec.Mat4.multVec4(this.invProj, x0, x0);
  goog.vec.Vec4.scale(x0, 1.0 / x0[3], x0);
  goog.vec.Mat4.multVec4(this.invView, x0, x0);

  var x1 = goog.vec.Vec4.createFloat32FromValues(x, y, +1, 1);
  goog.vec.Mat4.multVec4(this.invProj, x1, x1);
  goog.vec.Vec4.scale(x1, 1.0 / x1[3], x1);
  goog.vec.Mat4.multVec4(this.invView, x1, x1);

  var dir = goog.vec.Vec4.createFloat32();
  goog.vec.Vec3.subtract(x1, x0, dir);
  goog.vec.Vec3.normalize(dir, dir);

  return new goog.vec.Ray(x0, dir);
};


/**
 * Returns the frustum that corresponds to a selection group.
 */
shapy.editor.Camera.prototype.groupcast = goog.abstractMethod;


/**
 * Maximum zoom level.
 * @type {number} @const
 */
shapy.editor.Camera.MAX_ZOOM = 40.0;


/**
 * Maximum zoom level.
 * @type {number} @const
 */
shapy.editor.Camera.MIN_ZOOM = 0.5;


/**
 * Zoom speed.
 * @type {number} @const
 */
shapy.editor.Camera.ZOOM_SPEED = 0.85;


/**
 * Panning speed.
 * @type {number} @const
 */
shapy.editor.Camera.PAN_SPEED = 15;


/**
 * Perspective camera.
 *
 * @constructor
 * @extends {shapy.editor.Camera}
 */
shapy.editor.Camera.Persp = function() {
  shapy.editor.Camera.call(this);

  /** @public {number} */
  this.znear = 0.1;
  /** @public {number} */
  this.zfar = 100.0;
  /** @public {number} */
  this.fov = 45.0;
};
goog.inherits(shapy.editor.Camera.Persp, shapy.editor.Camera);


/**
 * Camera matrices.
 */
shapy.editor.Camera.Persp.prototype.compute = function() {
  goog.vec.Mat4.makeLookAt(
      this.view, this.eye, this.center, this.up);

  goog.vec.Mat4.makePerspective(
      this.proj,
      this.fov / 180 * Math.PI,
      this.aspect,
      this.znear,
      this.zfar);
  goog.vec.Mat4.multMat(this.proj, this.view, this.vp);
  goog.vec.Mat4.invert(this.view, this.invView);
  goog.vec.Mat4.invert(this.proj, this.invProj);
};


/**
 * Returns the frustum that corresponds to a selection group.
 *
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 *
 * @return {!Object}
 */
shapy.editor.Camera.prototype.groupcast = function(x0, y0, x1, y1) {
  var corners = goog.array.map([
    goog.vec.Vec4.createFloat32FromValues(x0, y0, -1, 1),
    goog.vec.Vec4.createFloat32FromValues(x0, y0, +1, 1),
    goog.vec.Vec4.createFloat32FromValues(x0, y1, -1, 1),
    goog.vec.Vec4.createFloat32FromValues(x0, y1, +1, 1),
    goog.vec.Vec4.createFloat32FromValues(x1, y1, -1, 1),
    goog.vec.Vec4.createFloat32FromValues(x1, y1, +1, 1),
    goog.vec.Vec4.createFloat32FromValues(x1, y0, -1, 1),
    goog.vec.Vec4.createFloat32FromValues(x1, y0, +1, 1),
  ], function(v) {
    goog.vec.Mat4.multVec4(this.invProj, v, v);
    goog.vec.Vec4.scale(v, 1.0 / v[3], v);
    goog.vec.Mat4.multVec4(this.invView, v, v);
    return v;
  }, this);

  var e0 = goog.vec.Vec3.createFloat32();
  var e1 = goog.vec.Vec3.createFloat32();
  var buildPlane = function(a, b, c) {
    var n = goog.vec.Vec3.createFloat32();
    goog.vec.Vec3.subtract(a, c, e0);
    goog.vec.Vec3.subtract(b, c, e1);
    goog.vec.Vec3.cross(e0, e1, n);
    goog.vec.Vec3.normalize(n, n);

    return {
      n: n,
      o: goog.vec.Vec3.cloneFloat32(c)
    };
  };

  var planes = [
    buildPlane(corners[0], corners[1], corners[2]),
    buildPlane(corners[2], corners[3], corners[4]),
    buildPlane(corners[4], corners[5], corners[6]),
    buildPlane(corners[6], corners[7], corners[0]),
  ];

  return planes;
};



/**
 * Ortho camera.
 *
 * @constructor
 * @extends {shapy.editor.Camera}
 */
shapy.editor.Camera.Ortho = function() {
  shapy.editor.Camera.call(this);

  this.znear = 0.1;
  this.zfar = 100;
  this.offset_ = goog.vec.Vec3.createFloat32();
};
goog.inherits(shapy.editor.Camera.Ortho, shapy.editor.Camera);


/**
 * Camera matrices.
 */
shapy.editor.Camera.Ortho.prototype.compute = function() {
  // The width and height of the frustum should be equal to the distance of the
  // eye from it's center (or, the size should be the width/height over 2)
  goog.vec.Vec3.subtract(this.eye, this.center, this.offset_);
  var fSize = goog.vec.Vec3.magnitude(this.offset_) * 0.5;

  goog.vec.Mat4.makeLookAt(
      this.view, this.eye, this.center, this.up);
  goog.vec.Mat4.makeOrtho(
      this.proj,
      -fSize, fSize,
      -fSize / this.aspect, fSize / this.aspect,
      this.znear, this.zfar);
  goog.vec.Mat4.multMat(this.proj, this.view, this.vp);
  goog.vec.Mat4.invert(this.view, this.invView);
  goog.vec.Mat4.invert(this.proj, this.invProj);
};
