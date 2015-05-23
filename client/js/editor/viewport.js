// This file is part of the Shapy project.
// Licensing information can be found in the LICENSE file.
// (C) 2015 The Shapy Team. All rights reserved.
goog.provide('shapy.editor.Layout');
goog.provide('shapy.editor.Layout.Single');
goog.provide('shapy.editor.Layout.Double');
goog.provide('shapy.editor.Layout.Quad');
goog.provide('shapy.editor.Viewport');

goog.require('goog.math.Rect');
goog.require('goog.math.Size');
goog.require('goog.math.Vec2');
goog.require('goog.vec.Quaternion');



/**
 * Class that manages the layout of multiple viewports on the screen.
 *
 * @constructor
 *
 * @param {!Object<string, shapy.editor.Viewport>} viewports Map of viewports.
 */
shapy.editor.Layout = function(viewports) {
  /**
   * Map of all viewports on the screen.
   * @public {!Object<string, shapy.editor.Viewport>}
   * @const
   */
  this.viewports = viewports;

  /**
   * The size of the entire screen.
   * @protected {!goog.math.Size}
   * @const
   */
  this.size = new goog.math.Size(0, 0);

  /**
   * Pointer to the active viewport.
   * @public {!shapy.editor.Viewport}
   */
  this.lastHover = goog.object.getAnyValue(this.viewports);

  /**
   * Active viewport receiving keyboard events.
   * @public {!shapy.editor.Viewport}
   */
  this.active = this.lastHover;
  this.active.active = true;
};


/**
 * Recomputes the positions & sizes of all viewports.
 *
 * @param {number} w Width of the screen.
 * @param {number} h Height of the screen.
 */
shapy.editor.Layout.prototype.resize = function(w, h) {
  this.size.width = w;
  this.size.height = h;
};


/**
 * Finds out which viewport is touched by the mouse.
 *
 * @private
 *
 * @param {number} x Mouse X position.
 * @param {number} y Mouse Y position.
 *
 * @return {?{ vp: shapy.editor.Viewport, x: number, y: number }}
 */
shapy.editor.Layout.prototype.getViewport_ = function(x, y) {
  for (var name in this.viewports) {
    if (!this.viewports.hasOwnProperty(name)) {
      continue;
    }
    var vp = this.viewports[name];
    if (x < vp.rect.x || vp.rect.x + vp.rect.w < x) {
      continue;
    }
    if (y < vp.rect.y || vp.rect.y + vp.rect.h < y) {
      continue;
    }
    return {
      vp: vp,
      x: x - vp.rect.x,
      y: y - vp.rect.y
    };
  }
  return null;
};


/**
 * Handles a mouse motion event.
 *
 * @param {MouseEvent} e
 */
shapy.editor.Layout.prototype.mouseMove = function(e) {
  var result = this.getViewport_(e.offsetX, e.offsetY);
  if (!result || !result.vp) {
    return;
  }

  if (this.lastHover && result.vp == this.lastHover) {
    this.lastHover.mouseMove(result.x, result.y);
  } else {
    if (this.lastHover) {
      this.lastHover.mouseLeave();
    }

    this.lastHover = result.vp;
    this.lastHover.mouseEnter(result.x, result.y);
  }
};


/**
 * Handles a mouse press event.
 *
 * @param {MouseEvent} e Original event.
 */
shapy.editor.Layout.prototype.mouseDown = function(e) {
  var result = this.getViewport_(e.offsetX, e.offsetY);
  if (!result || !result.vp) {
    return;
  }

  result.vp.mouseDown(result.x, result.y, e.which);

  this.active.active = false;
  this.active = result.vp;
  this.active.active = true;
};


/**
 * Handles a mouse release event.
 *
 * @param {MouseEvent} e
 */
shapy.editor.Layout.prototype.mouseUp = function(e) {
  var result = this.getViewport_(e.offsetX, e.offsetY);
  if (!result || !result.vp) {
    return;
  }

  result.vp.mouseUp(result.x, result.y);
};


/**
 * Handles a mouse enter event.
 *
 * @param {MouseEvent} e
 */
shapy.editor.Layout.prototype.mouseEnter = function(e) {
  var result = this.getViewport_(e.offsetX, e.offsetY);
  if (!result || result.vp) {
    return;
  }

  this.lastHover = result.vp;
  this.lastHover.mouseEnter(result.x, result.y);
};


/**
 * Handles a mouse leave event.
 *
 * @param {MouseEvent} e
 */
shapy.editor.Layout.prototype.mouseLeave = function(e) {
  if (!this.lastHover) {
    return;
  }

  this.lastHover.mouseLeave();
  this.lastHover = null;
};


/**
 * Handles a mouse wheel event.
 *
 * @param {MouseEvent} e
 */
shapy.editor.Layout.prototype.mouseWheel = function(e) {
  if (!this.lastHover) {
    return;
  }

  this.lastHover.mouseWheel(e.originalEvent.wheelDelta);
};



/**
 * Creates a layout with a single viewport.
 *
 * @constructor
 * @extends {shapy.editor.Layout}
 */
shapy.editor.Layout.Single = function() {
  /** @public {!shapy.editor.Viewport} @const */
  this.viewport = new shapy.editor.Viewport('viewport');

  shapy.editor.Layout.call(this, {
      'viewport': this.viewport
  });
};
goog.inherits(shapy.editor.Layout.Single, shapy.editor.Layout);


/**
 * Recomputes the positions & sizes of all viewports.
 *
 * @param {number} w Width of the window.
 * @param {number} h Height of the window.
 */
shapy.editor.Layout.Single.prototype.resize = function(w, h) {
  goog.base(this, 'resize', w, h);

  this.viewport.resize(0, 0, w, h);
};



/**
 * Creates a layout by splitting the screen into 2 vertically.
 *
 * @constructor
 * @extends {shapy.editor.Layout}
 */
shapy.editor.Layout.Double = function() {
  /** @public {!shapy.editor.Viewport} @const */
  this.left = new shapy.editor.Viewport('left');
  /** @public {!shapy.editor.Viewport} @const */
  this.right = new shapy.editor.Viewport('right');

  /** @private {number} */
  this.split_ = 0.5;
  /** @private {number} */
  this.bar_ = 0;
  /** @private {boolean} */
  this.hover_ = false;
  /** @private {boolean} */
  this.resize_ = false;

  shapy.editor.Layout.call(this, {
      'left': this.left,
      'right': this.right,
  });
};
goog.inherits(shapy.editor.Layout.Double, shapy.editor.Layout);


/**
 * Recomputes the positions & sizes of all viewports.
 *
 * @param {number} w Width of the window.
 * @param {number} h Height of the window.
 */
shapy.editor.Layout.Double.prototype.resize = function(w, h) {
  goog.base(this, 'resize', w, h);

  this.bar_ = w * this.split_;
  this.left.resize(0, 0, w * this.split_, h);
  this.right.resize(w * this.split_, 0, w * (1 - this.split_), h);
};


/**
 * Handles a mouse motion event.
 *
 * @param {MouseEvent} e
 */
shapy.editor.Layout.Double.prototype.mouseMove = function(e) {
  this.hover_ = Math.abs(e.offsetX - this.bar_) < 5;

  if (this.resize_) {
    this.split_ = e.offsetX / this.size.width;
    this.split_ = Math.max(0.1, Math.min(0.9, this.split_));
    this.resize(this.size.width, this.size.height);
  }

  if (this.hover_) {
    $('html,body').css('cursor', 'ew-resize');
  } else {
    $('html,body').css('cursor', 'auto');
    goog.base(this, 'mouseMove', e);
  }
};


/**
 * Handles a mouse motion event.
 *
 * @param {MouseEvent} e
 */
shapy.editor.Layout.Double.prototype.mouseDown = function(e) {
  this.resize_ = this.hover_;
  if (!this.resize_) {
    goog.base(this, 'mouseDown', e);
  }
};


/**
 * Handles a mouse up event.
 *
 * @param {MouseEvent} e
 */
shapy.editor.Layout.Double.prototype.mouseUp = function(e) {
  if (!this.resize_) {
    goog.base(this, 'mouseUp', e);
  }
  this.hover_ = this.resize_ = false;
};


/**
 * Handles a mouse leave event.
 *
 * @param {MouseEvent} e
 */
shapy.editor.Layout.Double.prototype.mouseLeave = function(e) {
  if (!this.resize) {
    goog.base(this, 'mouseLeave', e);
  }
  this.hover_ = this.resize_ = false;
};



/**
 * Creates a layout by splitting the screen into 4 viewport.
 *
 * @constructor
 * @extends {shapy.editor.Layout}
 */
shapy.editor.Layout.Quad = function() {
  /** @public {!shapy.editor.Viewport} @const */
  this.topLeft = new shapy.editor.Viewport('top-left');
  /** @public {!shapy.editor.Viewport} @const */
  this.topRight = new shapy.editor.Viewport('top-right');
  /** @public {!shapy.editor.Viewport} @const */
  this.bottomLeft = new shapy.editor.Viewport('bottom-left');
  /** @public {!shapy.editor.Viewport} @const */
  this.bottomRight = new shapy.editor.Viewport('bottom-right');

  /** @private {number} */
  this.splitX_ = 0.5;
  /** @private {number} */
  this.barX_ = 0;
  /** @private {boolean} */
  this.hoverX_ = false;
  /** @private {boolean} */
  this.resizeX_ = false;

  /** @private {number} */
  this.splitY_ = 0.5;
  /** @private {number} */
  this.barY_ = 0;
  /** @private {boolean} */
  this.resizeY_ = false;
  /** @private {boolean} */
  this.hoverY_ = false;

  shapy.editor.Layout.call(this, {
      'top-left': this.topLeft,
      'top-right': this.topRight,
      'bottom-left': this.bottomLeft,
      'bottom-right': this.bottomRight
  });
};
goog.inherits(shapy.editor.Layout.Quad, shapy.editor.Layout);


/**
 * Recomputes the positions & sizes of all viewports.
 *
 * @param {number} w Width of the window.
 * @param {number} h Height of the window.
 */
shapy.editor.Layout.Quad.prototype.resize = function(w, h) {
  goog.base(this, 'resize', w, h);

  this.barX_ = Math.floor(w * this.splitX_);
  this.barY_ = Math.floor(h * this.splitY_);

  this.topLeft.resize(
      0,
      0,
      this.barX_,
      this.barY_);
  this.topRight.resize(
      this.barX_,
      0,
      w - this.barX_,
      this.barY_);
  this.bottomLeft.resize(
      0,
      this.barY_,
      this.barX_,
      h - this.barY_);
  this.bottomRight.resize(
      this.barX_,
      this.barY_,
      w - this.barX_,
      h - this.barY_);
};


/**
 * Handles a mouse motion event.
 *
 * @param {MouseEvent} e
 */
shapy.editor.Layout.Quad.prototype.mouseMove = function(e) {
  this.hoverX_ = Math.abs(e.offsetX - this.barX_) < 5;
  this.hoverY_ = Math.abs(e.offsetY - this.barY_) < 5;

  if (this.resizeX_) {
    this.splitX_ = e.offsetX / this.size.width;
    this.splitX_ = Math.max(0.1, Math.min(0.9, this.splitX_));
  }
  if (this.resizeY_) {
    this.splitY_ = e.offsetY / this.size.height;
    this.splitY_ = Math.max(0.1, Math.min(0.9, this.splitY_));
  }

  if (this.resizeX_ || this.resizeY_) {
    this.resize(this.size.width, this.size.height);
  }

  if (this.hoverX_ && this.hoverY_) {
    $('html,body').css('cursor', 'move');
  } else if (this.hoverX_) {
    $('html,body').css('cursor', 'ew-resize');
  } else if (this.hoverY_) {
    $('html,body').css('cursor', 'ns-resize');
  } else {
    $('html,body').css('cursor', 'auto');
    goog.base(this, 'mouseMove', e);
  }
};


/**
 * Handles a mouse motion event.
 *
 * @param {MouseEvent} e
 */
shapy.editor.Layout.Quad.prototype.mouseDown = function(e) {
  this.resizeX_ = this.hoverX_;
  this.resizeY_ = this.hoverY_;

  if (!this.resizeX_ && !this.resizeY_) {
    goog.base(this, 'mouseDown', e);
  }
};


/**
 * Handles a mouse up event.
 *
 * @param {MouseEvent} e
 */
shapy.editor.Layout.Quad.prototype.mouseUp = function(e) {
  if (!this.resizeX_ && !this.resizeY_) {
    goog.base(this, 'mouseUp', e);
  }
  this.hoverX_ = this.hoverY_ = this.resizeX_ = this.resizeY_ = false;
};


/**
 * Handles a mouse leave event.
 *
 * @param {MouseEvent} e
 */
shapy.editor.Layout.Quad.prototype.mouseLeave = function(e) {
  if (!this.resizeX_ && !this.resizeY_) {
    goog.base(this, 'mouseLeave', e);
  }
  this.hoverX_ = this.hoverY_ = this.resizeX_ = this.resizeY_ = false;
};



/**
 * A single viewport, our eye into the world.
 *
 * @constructor
 *
 * @param {string} name Name of the viewport.
 */
shapy.editor.Viewport = function(name) {
  /**
   * The name of the viewport.
   * @public {string}
   * @const
   */
  this.name = name;

  /**
   * The camera attached to the viewport.
   * @public {!shapy.editor.Camera}
   * @const
   */
  this.camera = new shapy.editor.Camera.Persp();

  /**
   * The size and position of the viewport.
   * @public {!goog.math.Size}
   * @const
   */
  this.rect = new goog.math.Rect(0, 0, 0, 0);

  /**
   * Type of the viewport.
   * @public {!shapy.editor.Viewport.Type}
   */
  this.type = shapy.editor.Viewport.Type.PERSPECTIVE;

  /**
   * Current position of the mouse.
   * @private {!goog.math.Vec2}
   */
  this.currMousePos_ = new goog.math.Vec2(0, 0);

  /**
   * Last position of the mouse.
   * @private {!goog.math.Vec2}
   */
  this.lastMousePos_ = new goog.math.Vec2(0, 0);

  /**
   * Flag indicating if the camera is rotating.
   * @private {boolean}
   */
   this.isRotating_ = false;

  /**
   * Flag indicating if the camera is panning.
   * @private {boolean}
   */
   this.isPanning_ = false;

  /**
   * Flag indicating if the viewport is active, i.e. it is highlighted.
   * @public {boolean}
   */
  this.active = false;
};


/**
 * Resizes the viewport, specifying a new position and size.
 *
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 */
shapy.editor.Viewport.prototype.resize = function(x, y, w, h) {
  this.rect.x = x;
  this.rect.y = y;
  this.rect.w = w;
  this.rect.h = h;
  this.camera.resize(w, h);
};


/**
 * Handles a mouse motion event.
 *
 * @param {number} x Mouse X coordinate.
 * @param {number} y Mouse Y coordinate.
 */
shapy.editor.Viewport.prototype.mouseMove = function(x, y) {
  this.currMousePos_.x = x;
  this.currMousePos_.y = y;

  if (this.isRotating_) {
    this.rotate();
  }
  if (this.isPanning_) {
    this.pan();
  }
};


/**
 * Handles a mouse enter event.
 *
 * @param {number} x Mouse X coordinate.
 * @param {number} y Mouse Y coordinate.
 */
shapy.editor.Viewport.prototype.mouseEnter = function(x, y) {
  //console.log('enter', x, y);
};


/**
 * Handles a mouse leave event.
 */
shapy.editor.Viewport.prototype.mouseLeave = function() {
  this.isRotating_ = false;
  this.isPanning_ = false;
};


/**
 * Handles a mouse press event.
 *
 * @param {number} x      Mouse X coordinate.
 * @param {number} y      Mouse Y coordinate.
 * @param {number} button Mouse button that was clicked.
 */
shapy.editor.Viewport.prototype.mouseDown = function(x, y, button) {
  this.currMousePos_.x = x;
  this.currMousePos_.y = y;
  this.lastMousePos_.x = x;
  this.lastMousePos_.y = y;

  switch (button) {
    case 1: {
      // TODO: selecting
      break;
    }
    case 2: {
      this.isPanning_ = true;
      break;
    }
    case 3: {
      this.isRotating_ = true;
      break;
    }
  }
};


/**
 * Handles a mouse release event.
 *
 * @param {number} x Mouse X coordinate.
 * @param {number} y Mouse Y coordinate.
 */
shapy.editor.Viewport.prototype.mouseUp = function(x, y) {
  this.isRotating_ = false;
  this.isPanning_ = false;
};


/**
 * Handles a mouse wheel event.
 *
 * @param {number} delta Mouse wheel delta value.
 */
shapy.editor.Viewport.prototype.mouseWheel = function(delta) {
  var diff = goog.vec.Vec3.createFloat32();
  goog.vec.Vec3.subtract(this.camera.eye, this.camera.center, diff);
  var zoomLevel = goog.vec.Vec3.magnitude(diff);

  // Determine if zooming in or out and update accordingly.
  if (delta < 0) {
    zoomLevel /= shapy.editor.Camera.ZOOM_SPEED;
  } else {
    zoomLevel *= shapy.editor.Camera.ZOOM_SPEED;
  }

  // Clip to MIN_ZOOM.
  if (zoomLevel < shapy.editor.Camera.MIN_ZOOM) {
    zoomLevel = shapy.editor.Camera.MIN_ZOOM;
  }

  // Clip to MAX_ZOOM.
  if (zoomLevel > shapy.editor.Camera.MAX_ZOOM) {
    zoomLevel = shapy.editor.Camera.MAX_ZOOM;
  }

  // Update the position of the camera.
  goog.vec.Vec3.normalize(diff, diff);
  goog.vec.Vec3.scale(diff, zoomLevel, diff);
  goog.vec.Vec3.add(this.camera.center, diff, this.camera.eye);
};


/**
 * Computes a normalised vector from the center of the virtual ball to
 * the point on the virtual ball surface that is aligned with the point (x, y)
 * on the screen.
 *
 * @private
 *
 * @param {!goog.math.Vec2} pos Position of the mouse.
 *
 * @return {!goog.vec.Vec3.Type} Arcball vector.
 */
shapy.editor.Viewport.prototype.getArcballVector_ = function(pos) {
  // Convert pos to camera coordinates [-1, 1].
  var p = goog.vec.Vec3.createFloat32FromValues(
      2 * pos.x / this.rect.w - 1.0,
      2 * pos.y / this.rect.h - 1.0,
      0);

  // Compute the square of the l2 norm of p.
  var l2Squared = p[0] * p[0] + p[1] * p[1];

  // Compute the z coordinate.
  if (l2Squared < 1.0) {
    p[2] = Math.sqrt(1 - l2Squared);
  } else {
    goog.vec.Vec3.normalize(p, p);
  }

  return p;
};

/**
 * Computes the angle and axis of the camera rotation.
 */
shapy.editor.Viewport.prototype.rotate = function() {
  if (this.currMousePos_.equals(this.lastMousePos_)) {
    return;
  }

  // Compute the points at the ball surface that match the click.
  var va = this.getArcballVector_(this.lastMousePos_);
  var vb = this.getArcballVector_(this.currMousePos_);
  this.lastMousePos_.x = this.currMousePos_.x;
  this.lastMousePos_.y = this.currMousePos_.y;

  // Compute the angle.
  var angle = Math.acos(Math.min(1.0, goog.vec.Vec3.dot(va, vb)));

  // Comute the inverse view matrix.
  this.camera.compute();
  var inv = goog.vec.Mat4.createFloat32();
  goog.vec.Mat4.invert(this.camera.view, inv);

  // Compute the axis.
  var axis = goog.vec.Vec3.createFloat32();
  goog.vec.Vec3.cross(va, vb, axis);
  goog.vec.Mat4.multVec3NoTranslate(inv, axis, axis);

  // Compute the rotation quaternion from the angle and the axis.
  var rotationQuater = goog.vec.Quaternion.createFloat32();
  goog.vec.Quaternion.fromAngleAxis(-angle, axis, rotationQuater);
  goog.vec.Quaternion.normalize(rotationQuater, rotationQuater);

  // Calculate the view vector.
  var viewVector = goog.vec.Vec3.createFloat32();
  goog.vec.Vec3.subtract(this.camera.eye, this.camera.center, viewVector);

  // Compute the quternion from the view vector.
  var viewQuater = goog.vec.Quaternion.createFloat32FromValues(
      viewVector[0],
      viewVector[1],
      viewVector[2],
      0);

  // Compute the new quaternion representing the rotation.
  var temp = goog.vec.Quaternion.createFloat32();
  goog.vec.Quaternion.conjugate(rotationQuater, temp);
  goog.vec.Quaternion.concat(rotationQuater, viewQuater, viewQuater);
  goog.vec.Quaternion.concat(viewQuater, temp, viewQuater);

  // Compute the updated view vector.
  goog.vec.Vec3.setFromValues(
      viewVector,
      viewQuater[0],
      viewQuater[1],
      viewQuater[2]);

  // Compute the new up vector.
  goog.vec.Vec3.cross(viewVector, this.camera.up, this.camera.up);
  goog.vec.Vec3.cross(this.camera.up, viewVector, this.camera.up);
  goog.vec.Vec3.normalize(this.camera.up, this.camera.up);

  // Update the eye.
  goog.vec.Vec3.add(this.camera.center, viewVector, this.camera.eye);
};


/**
 * Performs the paning.
 */
shapy.editor.Viewport.prototype.pan = function() {
  var left = goog.vec.Vec3.createFloat32();
  var up = goog.vec.Vec3.createFloat32();
  var v = goog.vec.Vec3.createFloat32();

  // Get the normal to the plane along which to rotate.
  goog.vec.Vec3.subtract(this.camera.eye, this.camera.center, v);
  goog.vec.Vec3.cross(v, this.camera.up, left);
  goog.vec.Vec3.normalize(left, left);
  goog.vec.Vec3.cross(left, v, up);
  goog.vec.Vec3.normalize(up, up);

  // Get movement.
  var dx =
      (this.currMousePos_.x - this.lastMousePos_.x) / this.rect.w *
      shapy.editor.Camera.PAN_SPEED;
  var dy =
      (this.currMousePos_.y - this.lastMousePos_.y) / this.rect.h *
      shapy.editor.Camera.PAN_SPEED;

  // Move along x.
  goog.vec.Vec3.scale(left, dx, left);
  goog.vec.Vec3.add(this.camera.center, left, this.camera.center);
  goog.vec.Vec3.add(this.camera.eye, left, this.camera.eye);

  // Move along y.
  goog.vec.Vec3.scale(up, dy, v);
  goog.vec.Vec3.negate(v, v);
  goog.vec.Vec3.add(this.camera.center, v, this.camera.center);
  goog.vec.Vec3.add(this.camera.eye, v, this.camera.eye);

  this.lastMousePos_.x = this.currMousePos_.x;
  this.lastMousePos_.y = this.currMousePos_.y;
};



/**
 * List of viewport types.
 * @enum {number}
 */
shapy.editor.Viewport.Type = {
  LEFT: 'left',
  RIGHT: 'right',
  TOP: 'top',
  BOTTOM: 'bottom',
  FRONT: 'front',
  BACK: 'back',
  ORTHO: 'ortho',
  PERSPECTIVE: 'perp'
};
