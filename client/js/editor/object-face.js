// This file is part of the Shapy project.
// Licensing information can be found in the LICENSE file.
// (C) 2015 The Shapy Team. All rights reserved.
goog.provide('shapy.editor.Face');

goog.require('goog.vec.Mat4');
goog.require('goog.vec.Vec2');
goog.require('goog.vec.Vec3');
goog.require('shapy.editor.Editable');
goog.require('shapy.editor.geom');



/**
 * Face of an object.
 *
 * @constructor
 * @extends {shapy.editor.Editable}
 *
 * @param {!shapy.editor.Object} object
 * @param {number}               id
 * @param {number}               e0
 * @param {number}               e1
 * @param {number}               e2
 * @param {number}               opt_ue0
 * @param {number}               opt_ue1
 * @param {number}               opt_ue2
 */
shapy.editor.Face = function(
    object, id,
    e0, e1, e2,
    opt_ue0, opt_ue1, opt_ue2)
{
  shapy.editor.Editable.call(this, shapy.editor.Editable.Type.FACE);

  /** @public {!shapy.editor.Object} @const */
  this.object = object;
  /** @public {!number} @const */
  this.id = parseInt(id);
  /** @public {number} @const */
  this.e0 = parseInt(e0);
  /** @public {number} @const */
  this.e1 = parseInt(e1);
  /** @public {number} @const */
  this.e2 = parseInt(e2);
  /** @public {number} @const */
  this.ue0 = opt_ue0 || 0;
  /** @public {number} @const */
  this.ue1 = opt_ue1 || 0;
  /** @public {number} @const */
  this.ue2 = opt_ue2 || 0;
};
goog.inherits(shapy.editor.Face, shapy.editor.Editable);


/**
 * Retrieves the edges forming a face.
 *
 * @return {!Array<!shapy.editor.Edge>}
 */
shapy.editor.Face.prototype.getEdges = function() {
  return [
    this.object.edges[this.e0 >= 0 ? this.e0 : -this.e0],
    this.object.edges[this.e1 >= 0 ? this.e1 : -this.e1],
    this.object.edges[this.e2 >= 0 ? this.e2 : -this.e2]
  ];
};


/**
 * Retrives the vertices forming a face.
 *
 * @return {!Array<!shapy.editor.Vertex>}
 */
shapy.editor.Face.prototype.getVertices = function() {
  var e = this.getEdges();
  return [
    this.object.verts[this.e0 >= 0 ? e[0].v0 : e[0].v1],
    this.object.verts[this.e1 >= 0 ? e[1].v0 : e[1].v1],
    this.object.verts[this.e2 >= 0 ? e[2].v0 : e[2].v1],
  ];
};


/**
 * Retrives the vertices forming a face.
 *
 * @return {!Array<!shapy.editor.Vertex>}
 */
shapy.editor.Face.prototype.getUVEdges = function() {
  var e = this.getEdges();
  return [
    this.object.uvEdges[this.ue0 >= 0 ? this.ue0 : -this.ue0],
    this.object.uvEdges[this.ue1 >= 0 ? this.ue1 : -this.ue1],
    this.object.uvEdges[this.ue2 >= 0 ? this.ue2 : -this.ue2],
  ];
};



/**
 * Retrives the uv.
 *
 * @return {!Array<!shapy.editor.Vertex>}
 */
shapy.editor.Face.prototype.getUVs = function() {
  if (!this.ue0 || !this.ue1 || !this.ue2) {
    return [];
  }
  var e = this.getUVEdges();
  return [
    this.object.uvPoints[this.ue0 >= 0 ? e[0].uv0 : e[0].uv1],
    this.object.uvPoints[this.ue1 >= 0 ? e[1].uv0 : e[1].uv1],
    this.object.uvPoints[this.ue2 >= 0 ? e[2].uv0 : e[2].uv1],
  ];
};


/**
 * Retrieves the object edited.
 *
 * @return {shapy.editor.Object}
 */
shapy.editor.Face.prototype.getObject = function() {
  return this.object;
};


/**
 * Retrives the positions of vertices forming a face.
 *
 * @private
 *
 * @return {!Array<shapy.editor.Edge>}
 */
shapy.editor.Face.prototype.getVertexPositions_ = function() {
  var verts = this.getVertices();
  return [verts[0].position, verts[1].position, verts[2].position];
};


/**
 * Calculate the normal of the face
 *
 * @return {!goog.vec.Vec3.Type}
 */
shapy.editor.Face.prototype.calculateNormal = function() {
  var normal = goog.vec.Vec3.createFloat32();
  var ab = goog.vec.Vec3.createFloat32();
  var ac = goog.vec.Vec3.createFloat32();
  var verts = this.getVertexPositions_();

  goog.vec.Vec3.subtract(verts[1], verts[0], ab);
  goog.vec.Vec3.subtract(verts[2], verts[0], ac);
  goog.vec.Vec3.cross(ac, ab, normal);
  goog.vec.Vec3.normalize(normal, normal);

  return normal;
};


/**
 * Retrieves the face position.
 *
 * @return {!goog.vec.Vec3.Type}
 */
shapy.editor.Face.prototype.getPosition = function() {
  var t = this.getVertexPositions_();
  var c = shapy.editor.geom.getCentroid(t[0], t[1], t[2]);
  goog.vec.Mat4.multVec3(this.object.model, c, c);
  return c;
};


/**
 * Deletes the face.
 */
shapy.editor.Face.prototype.delete = function() {
  // Removes UV edges if not shared with other faces.

  // Removes the face from the object.
  goog.object.remove(this.object.faces, this.id);
  this.object.dirty = true;
};


/**
 * Picks UV of the face.
 *
 * @param {!goog.vec.Ray}       ray
 *
 * @return {!{u: number, v: number}}
 */
shapy.editor.Face.prototype.pickUV = function(ray) {
  var verts = this.getVertices();
  var uvs = this.getUVs();
  if (!uvs || goog.array.isEmpty(uvs)) {
    return { u: 0, v: 0 };
  }

  // Get vertex position.
  var p0 = goog.vec.Vec3.cloneFloat32(verts[0].position);
  var p1 = goog.vec.Vec3.cloneFloat32(verts[1].position);
  var p2 = goog.vec.Vec3.cloneFloat32(verts[2].position);

  // Transform points into worlds space.
  goog.vec.Mat4.multVec3(this.object.model, p0, p0);
  goog.vec.Mat4.multVec3(this.object.model, p1, p1);
  goog.vec.Mat4.multVec3(this.object.model, p2, p2);

  // Get bary coords.
  var bary = shapy.editor.geom.intersectTriangleBary(ray, p0, p1, p2);
  if (!bary) {
    return {u: 0, v: 0};
  }
  return {
    u: (bary.a * uvs[0].u) + (bary.b * uvs[1].u) + (bary.c * uvs[2].u),
    v: (bary.a * uvs[0].v) + (bary.b * uvs[1].v) + (bary.c * uvs[2].v)
  };
};
