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
  this.object.dirty = true;
};


/**
 * Selects the editable.
 *
 * @param {boolean} selected
 */
shapy.editor.Editable.prototype.setSelected = function(selected) {
  this.selected = selected;

  goog.object.forEach(this.editables, function(editable) {
    editable.setSelected(selected);
  }, this);

  this.object.dirty = true;
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
 * Retrieves this UV point.
 *
 * @return {Array}
 */
shapy.editor.Editable.prototype.getUVs = function() {
  return [];
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
 * @return {!Array<!shapy.editor.Vertex>}
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
  var sel = null;
  goog.array.some(this.editables, function(editable) {
    sel = sel || editable.selected;
    return sel != null;
  }, this);
  return sel;
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
    if (editable.getPosition) {
      goog.vec.Vec3.add(position, editable.getPosition(), position);
    }
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
 * Deletes the editables in the group.
 */
shapy.editor.EditableGroup.prototype.delete = function() {
  goog.object.forEach(this.editables, function(object) {
    object.delete();
  });
  this.editables = [];
};


/**
 * Retrives the editables forming this group
 *
 * @return {!Array<!shapy.editor.Editable>}
 */
shapy.editor.EditableGroup.prototype.getEditables = function() {
  return this.editables;
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
 * @param {number} dx
 * @param {number} dy
 * @param {number} dz
 */
shapy.editor.PartsGroup.prototype.translate = function(dx, dy, dz) {
  // Apply translation to each vertex
  goog.object.forEach(this.getVertices(), function(vertex) {
    vertex.translate(dx, dy, dz);
  }, this);
};


/**
 * Scales the group.
 *
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
shapy.editor.PartsGroup.prototype.scale = function(x, y, z) {
  var verts = this.getVertices();
  var mid = goog.vec.Vec3.createFloat32();
  goog.object.forEach(verts, function(v) {
    goog.vec.Vec3.add(mid, v.getPosition(), mid);
  });
  goog.vec.Vec3.scale(mid, 1.0 / verts.length, mid);

  var d = goog.vec.Vec3.createFloat32();

  // Apply translation to each object
  goog.object.forEach(verts, function(vert) {
    goog.vec.Vec3.subtract(vert.getPosition(), mid, d);
    vert.translate(d[0] * x - d[0], d[1] * y - d[1], d[2] * z - d[2]);
  });
};


/**
 * Rotates the group.
 *
 * @param {!goog.vec.Quaternion} q
 */
shapy.editor.PartsGroup.prototype.rotate = function(q) {
  var verts = this.getVertices();
  var mid = goog.vec.Vec3.createFloat32();

  goog.object.forEach(verts, function(v) {
    goog.vec.Vec3.add(mid, v.getPosition(), mid);
  });
  goog.vec.Vec3.scale(mid, 1.0 / verts.length, mid);

  var c = goog.vec.Quaternion.createFloat32();
  var d = goog.vec.Vec3.createFloat32();
  var dq = goog.vec.Quaternion.createFloat32();
  goog.vec.Quaternion.conjugate(q, c);

  goog.object.forEach(verts, function(vert) {
    goog.vec.Vec3.subtract(vert.getPosition(), mid, d);

    // Compute the rotation quaternion
    goog.vec.Quaternion.setFromValues(dq, d[0], d[1], d[2], 0.0);
    goog.vec.Quaternion.concat(q, dq, dq);
    goog.vec.Quaternion.concat(dq, c, dq);

    // Translate.
    vert.translate(dq[0] - d[0], dq[1] - d[1], dq[2] - d[2]);
  });
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
 * @return {!Array<!shapy.editor.Vertex>}
 */
shapy.editor.PartsGroup.prototype.getVertices = function() {
  var verts = goog.array.flatten(goog.array.map(this.editables, function(e) {
    return e.getVertices();
  }, this));
  goog.array.removeDuplicates(verts);
  return verts;
};


/**
 * Returns the uv points.
 *
 * @return {!Array<!shapy.editor.UVPoint>}
 */
shapy.editor.PartsGroup.prototype.getUVPoints = function() {
  var uvs = goog.array.flatten(goog.array.map(this.editables, function(e) {
    return e.getUVs();
  }, this));
  goog.array.removeDuplicates(uvs);
  return uvs;
};


/**
 * Returns ids of the uv points.
 * @return {!Array<number>}
 */
shapy.editor.PartsGroup.prototype.getUVIds = function() {
  return goog.array.map(this.getUVPoints(), function(uv) {
    return uv.id;
  }, this);
};


/**
 * Retrieves ids of all the vertices from the group.
 *
 * @return {!Array<number>}
 */
shapy.editor.PartsGroup.prototype.getVertIds = function() {
  return goog.array.map(this.getVertices(), function(vertex) {
    return vertex.id;
  }, this);
};


/**
 * Retrieves the faces forming the group.
 *
 * @return {!Array<!shapy.editor.Vertex>}
 */
shapy.editor.PartsGroup.prototype.getFaces = function() {
  return goog.array.filter(this.editables, function(e) {
    return e.type == shapy.editor.Editable.Type.FACE;
  });
};


/**
 * Retrieves ids of the faces forming the group.
 *
 * @return {!Array<number>}
 */
shapy.editor.PartsGroup.prototype.getFaceIds = function() {
  return goog.array.map(this.getFaces(), function(face) {
    return face.id;
  }, this);
};


/**
 * Retrives [obj id, vert id] pairs forming the group.
 */
shapy.editor.PartsGroup.prototype.getObjVertIds = function() {
  return goog.array.map(this.getVertices(), function(vertex) {
    return [vertex.object.id, vertex.id];
  }, this);
};


/**
 * Retrieves [obj id, part id, part type] triples forming the group.
 */
shapy.editor.PartsGroup.prototype.getObjPartIds = function() {
  return goog.array.map(this.editables, function(editable) {
    return [editable.object.id, editable.id, editable.type];
  }, this);
};


/**
 * Delegates project UV to the owner of the group
 * PRE: All parts of the group belong to the same object.
 */
shapy.editor.PartsGroup.prototype.projectUV = function() {
  this.editables[0].object.projectUV();
};


/**
 * Moves all UV coordinates.
 *
 * @param {number} du
 * @param {number} dv
 */
shapy.editor.PartsGroup.prototype.moveUV = function(du, dv) {
  var uvs = this.getUVPoints();
  goog.array.map(uvs, function(uv) {
    uv.object.dirty = true;
    uv.u += du;
    uv.v += dv;
  });
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
 * @param {number} dx
 * @param {number} dy
 * @param {number} dz
 */
shapy.editor.ObjectGroup.prototype.translate = function(dx, dy, dz) {
  // Apply translation to each object
  goog.object.forEach(this.editables, function(object) {
    object.translate(dx, dy, dz);
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
  var mid = this.getPosition();
  var d = goog.vec.Vec3.createFloat32();

  // Apply translation to each object
  goog.object.forEach(this.editables, function(object) {
    goog.vec.Vec3.subtract(object.getPosition(), mid, d);
    object.translate(d[0] * x - d[0], d[1] * y - d[1], d[2] * z - d[2]);
    object.scale(x, y, z);
  });
};


/**
 * Rotate the group
 *
 * @param {!goog.vec.Quaternion.Type} q
 */
shapy.editor.ObjectGroup.prototype.rotate = function(q) {
  var mid = this.getPosition();
  var c = goog.vec.Quaternion.createFloat32();
  var d = goog.vec.Vec3.createFloat32();
  var dq = goog.vec.Quaternion.createFloat32();
  goog.vec.Quaternion.conjugate(q, c);

  goog.object.forEach(this.editables, function(object) {
    goog.vec.Vec3.subtract(object.getPosition(), mid, d);

    // Compute the rotation quaternion
    goog.vec.Quaternion.setFromValues(dq, d[0], d[1], d[2], 0.0);
    goog.vec.Quaternion.concat(q, dq, dq);
    goog.vec.Quaternion.concat(dq, c, dq);

    // Translate.
    object.translate(dq[0] - d[0], dq[1] - d[1], dq[2] - d[2]);
    object.rotate(q);
  });
};


/**
 * Retrieves the list of ids of the group members.
 */
shapy.editor.ObjectGroup.prototype.getObjIds = function() {
  return goog.array.map(this.editables, function(object) {
    return object.id;
  }, this);
};



/**
 * List of editable types.
 * @enum {string}
 */
shapy.editor.Editable.Type = {
  OBJECT_GROUP: 'object_group',
  PARTS_GROUP: 'part_group',
  OBJECT: 'object',
  VERTEX: 'vertex',
  EDGE: 'edge',
  FACE: 'face',
  UV_POINT: 'uv_point',
  UV_EDGE: 'uv_edge'
};
