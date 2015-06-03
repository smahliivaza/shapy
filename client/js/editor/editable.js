// This file is part of the Shapy project.
// Licensing information can be found in the LICENSE file.
// (C) 2015 The Shapy Team. All rights reserved.
goog.provide('shapy.editor.Editable');



/**
 * Editable provides a way to manipulate properties of vertices, edges and
 * faces.
 *
 * - scale
 * - rotate
 * - translate
 *
 * This is just an interface - objects must implement individual methods.
 *
 * @constructor
 *
 * @param {string} type Type of the editable.
 */
shapy.editor.Editable = function(type) {
  /**
   * @public {shapy.editor.Editable.Type}
   * @const
   */
  this.type = type;

  /**
   * True if the mouse is over the editable.
   * @public {!boolean}
   */
  this.hover = false;

  /**
   * Information about the user who selected the object.
   * @public {shapy.User}
   */
  this.selected = false;
};


/**
 * Hovers over the editable.
 *
 * @param {boolean} hover
 */
shapy.editor.Editable.prototype.setHover = function(hover) {
  this.hover = hover;
  this.object.dirtyMesh = true;
};


/**
 * Selects the editable.
 *
 * @param {shapy.User} selected
 */
shapy.editor.Editable.prototype.setSelected = function(selected) {
  this.selected = selected;
  this.object.dirtyMesh = true;
};


/**
 * Checks if the editable is selected.
 *
 * @return {boolean} True if the editable was selected.
 */
shapy.editor.Editable.prototype.isSelected = function() {
  return this.selected;
};



/**
 * Scales the editable.
 */
shapy.editor.Editable.prototype.scale = function() { };


/**
 * Rotates the editable.
 */
shapy.editor.Editable.prototype.rotate = function() { };


/**
 * Translate the editable.
 */
shapy.editor.Editable.prototype.translate = function() { };


/**
 * Delete the editable from the mesh
 */
shapy.editor.Editable.prototype.delete = function() { };


/**
 * Retrives the vertices forming this editable.
 *
 * @return {!Array<!shapy.editor.Object.Vertex>}
 */
shapy.editor.Editable.prototype.getVertices = function() { return []; };


/**
 * Retrieves the object edited.
 *
 * @return {shapy.editor.Object}
 */
shapy.editor.Editable.prototype.getObject = function() { return null; };


/**
 * Collection of editable parts of an object.
 *
 * @param {=Array<shapy.editor.Editable>} opt_editables
 * @param {shapy.editor.Editable.Type}    type
 *
 * @constructor
 * @extends {shapy.editor.Editable}
 */
shapy.editor.EditableGroup = function(opt_editables, type) {
  shapy.editor.Editable.call(this, type);

  /** @public {!Array<shapy.editor.Editable>} List of editables to control */
  this.editables = opt_editables || [];
};
goog.inherits(shapy.editor.EditableGroup, shapy.editor.Editable);


/**
 * Returns all selected objects.
 *
 * @return {shapy.editor.Object}
 */
shapy.editor.EditableGroup.prototype.getObjects = function() {
  if (goog.array.isEmpty(this.editables)) {
    return null;
  }
  var objects = goog.array.map(this.editables, function(e) {
    return e.object;
  });
  goog.array.removeDuplicates(objects);
  return objects;
};


/**
 * Add an editable to the group, if it's not already in the group.
 *
 * @param {shapy.editor.Editable} editable Editable object to add.
 */
shapy.editor.EditableGroup.prototype.add = function(editable) {
  if (goog.isArray(editable)) {
    this.editables = goog.array.concat(this.editables, editable);
    return;
  }

  switch (editable.type) {
    case shapy.editor.Editable.Type.OBJECT_GROUP:
    case shapy.editor.Editable.Type.PARTS_GROUP:
    {
      this.editables = goog.array.concat(this.editables, editable.editables);
      break;
    }
    default: {
      goog.array.insert(this.editables, editable);
      break;
    }
  }
  goog.array.removeDuplicates(this.editables);
};


/**
 * Removes an element from the group.
 *
 * @param {shapy.editor.EditableGroup} editables Editables to remove.
 */
shapy.editor.EditableGroup.prototype.remove = function(editables) {
  this.editables = goog.array.filter(this.editables, function(e) {
    if (goog.isArray(editables)) {
      return !goog.array.contains(editables, e);
    } else {
      return !editables.contains(e);
    }
  });
};


/**
 * Checks if the group contains an object.
 *
 * @param {!shapy.editor.Object} object
 *
 * @return {boolean} True if th eobject is in the group.
 */
shapy.editor.EditableGroup.prototype.contains = function(object) {
  return goog.array.contains(this.editables, object);
};


/**
 * Clears the editable.
 */
shapy.editor.EditableGroup.prototype.clear = function() {
  this.editables = [];
};


/**
 * Determines whether the group is empty.
 *
 * @return {boolean} True if empty.
 */
shapy.editor.EditableGroup.prototype.isEmpty = function() {
  return goog.array.isEmpty(this.editables);
};


/**
 * Hovers the editable.
 *
 * @param {boolean} hover
 */
shapy.editor.EditableGroup.prototype.setHover = function(hover) {
  this.hover = hover;
  goog.object.forEach(this.editables, function(editable) {
    editable.setHover(hover);
  }, this);
};


/**
 * Selects the editable.
 *
 * @param {shapy.User} selected
 */
shapy.editor.EditableGroup.prototype.setSelected = function(selected) {
  this.selected = selected;
  goog.object.forEach(this.editables, function(editable) {
    editable.setSelected(selected);
  }, this);
};


/**
 * Checks if any of the editables is selected.
 *
 * @return {boolean} True if there is a selected editable.
 */
shapy.editor.EditableGroup.prototype.isSelected = function() {
  return goog.array.some(this.editables, function(editable) {
    return editable.selected;
  }, this);
};


/**
 * Retrieves the group average position
 *
 * @return {!goog.vec.Vec3.Type}
 */
shapy.editor.EditableGroup.prototype.getPosition = function() {
  var position = goog.vec.Vec3.createFloat32FromValues(0, 0, 0);
  if (goog.array.isEmpty(this.editables)) {
    return position;
  }

  goog.object.forEach(this.editables, function(editable) {
    goog.vec.Vec3.add(position, editable.getPosition(), position);
  }, this);
  goog.vec.Vec3.scale(position, 1 / this.editables.length, position);
  return position;
};


/**
 * Retrieves the group average scale.
 *
 * @return {!goog.vec.Vec3.Type}
 */
shapy.editor.EditableGroup.prototype.getScale = function() {
  var scale = goog.vec.Vec3.createFloat32FromValues(1, 1, 1);
  if (goog.array.isEmpty(this.editables)) {
    return scale;
  }

  goog.object.forEach(this.editables, function(editable) {
    goog.vec.Vec3.add(scale, editable.getScale(), scale);
  }, this);
  goog.vec.Vec3.scale(scale, 1 / this.editables.length, scale);
  return scale;
};


/**
 * Retrieves the group average rotation.
 *
 * @return {!goog.vec.Vec3.Type}
 */
shapy.editor.EditableGroup.prototype.getRotation = function() {
  var rotation = goog.vec.Vec3.createFloat32FromValues(0, 0, 0);
  if (goog.array.isEmpty(this.editables)) {
    return rotation;
  }

  goog.object.forEach(this.editables, function(editable) {
    goog.vec.Vec3.add(rotation, editable.getRotation(), rotation);
  }, this);
  goog.vec.Vec3.scale(rotation, 1 / this.editables.length, rotation);
  return rotation;
};


/**
 * Deletes the editables in the group.
 */
shapy.editor.EditableGroup.prototype.delete = function() {
  goog.object.forEach(this.editables, function(object) {
    object.delete();
  });
  this.editables = [];
};



/**
 * Collection of object parts.
 *
 * @param {!Array<shapy.editor.Editable>} parts
 *
 * @constructor
 * @extends {shapy.editor.Editable}
 */
shapy.editor.PartsGroup = function(parts) {
  shapy.editor.EditableGroup.call(
      this, parts, shapy.editor.Editable.Type.PARTS_GROUP);
};
goog.inherits(shapy.editor.PartsGroup, shapy.editor.EditableGroup);


/**
 * Translate the group
 *
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
shapy.editor.PartsGroup.prototype.translate = function(x, y, z) {
  var mid = this.getPosition();

  // Apply translation to each vertex
  goog.object.forEach(this.getVertices(), function(vertex) {
    var delta = goog.vec.Vec3.createFloat32FromValues(x, y, z);
    goog.vec.Vec3.subtract(delta, mid, delta);
    goog.vec.Vec3.add(delta, vertex.getPosition(), delta);
    vertex.translate(delta[0], delta[1], delta[2]);
  }, this);
};


/**
 * Returns the object if all selected parts are from the same object.
 *
 * @return {shapy.editor.Object}
 */
shapy.editor.PartsGroup.prototype.getObject = function() {
  if (goog.array.isEmpty(this.editables)) {
    return null;
  }
  var object = this.editables[0].object;
  return goog.array.every(this.editables, function(e) {
    return e.object == object;
  }) ? object : null;
};


/**
 * Retrives the vertices forming this group.
 *
 * @return {!Array<!shapy.editor.Object.Vertex>}
 */
shapy.editor.PartsGroup.prototype.getVertices = function() {
  var verts = goog.array.flatten(goog.array.map(this.editables, function(e) {
    return e.getVertices();
  }, this));
  goog.array.removeDuplicates(verts);
  return verts;
};



/**
 * Collection of objects.
 *
 * @param {!Array<shapy.editor.Editable>} objects
 *
 * @constructor
 * @extends {shapy.editor.Editable}
 */
shapy.editor.ObjectGroup = function(objects) {
  shapy.editor.EditableGroup.call(
      this, objects, shapy.editor.Editable.Type.OBJECT_GROUP);
};
goog.inherits(shapy.editor.ObjectGroup, shapy.editor.EditableGroup);


/**
 * Translate the group
 *
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
shapy.editor.ObjectGroup.prototype.translate = function(x, y, z) {
  var mid = this.getPosition();

  // Apply translation to each object
  goog.object.forEach(this.editables, function(object) {
    var delta = goog.vec.Vec3.createFloat32FromValues(x, y, z);
    goog.vec.Vec3.subtract(delta, mid, delta);
    goog.vec.Vec3.add(delta, object.getPosition(), delta);
    object.translate(delta[0], delta[1], delta[2]);
  });
};


/**
 * Scale the group
 *
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
shapy.editor.ObjectGroup.prototype.scale = function(x, y, z) {
  var scale = this.getScale();

  // Apply translation to each object
  goog.object.forEach(this.editables, function(object) {
    var delta = goog.vec.Vec3.createFloat32FromValues(x, y, z);
    goog.vec.Vec3.subtract(delta, scale, delta);
    goog.vec.Vec3.add(delta, object.getScale(), delta);
    object.scale(delta[0], delta[1], delta[2]);
  });
};


/**
 * Rotate the group
 *
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
shapy.editor.ObjectGroup.prototype.rotate = function(x, y, z, dx, dy, dz) {
  var m = goog.vec.Mat4.createFloat32();
  var mid = this.getPosition();

  goog.object.forEach(this.editables, function(object) {
    var d = goog.vec.Vec3.createFloat32();
    var p = object.getPosition();
    var r = object.getRotation();
    goog.vec.Vec3.subtract(p, mid, d);

    goog.vec.Mat4.makeIdentity(m);
    goog.vec.Mat4.rotateX(m, dx);
    goog.vec.Mat4.rotateY(m, dy);
    goog.vec.Mat4.rotateZ(m, dz);
    goog.vec.Mat4.multVec3NoTranslate(m, d, d);

    object.translate(mid[0] + d[0], mid[1] + d[1], mid[2] + d[2]);
    object.rotate(r[0] + dx, r[1] + dy, r[2] + dz);
  });
};



/**
 * List of editable types.
 * @enum {string}
 */
shapy.editor.Editable.Type = {
  OBJECT_GROUP: 'objectGroup',
  PARTS_GROUP: 'partsGroup',
  OBJECT: 'object',
  VERTEX: 'vertex',
  EDGE: 'edge',
  FACE: 'face'
};
