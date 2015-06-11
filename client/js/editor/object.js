// This file is part of the Shapy project.
// Licensing information can be found in the LICENSE file.
// (C) 2015 The Shapy Team. All rights reserved.
goog.provide('shapy.editor.Object');

goog.require('goog.vec.Mat4');
goog.require('goog.vec.Vec2');
goog.require('goog.vec.Vec3');
goog.require('shapy.editor.Editable');
goog.require('shapy.editor.geom');
goog.require('shapy.editor.Edge');
goog.require('shapy.editor.Face');
goog.require('shapy.editor.Vertex');



/**
 * Abstract object metadata.
 *
 * Properties:
 *  - rotate
 *  - translate
 *  - scale
 * These properties can be edited using markers placed over the object. They
 * apply to every single vertex in the object by defining the model
 * matrix of the object.
 *
 * @constructor
 * @extends {shapy.editor.Editable}
 *
 * @param {string}              id
 * @param {!shapy.editor.Scene} scene
 * @param {!Array<Object>}      verts
 * @param {!Array<Object>}      edges
 * @param {!Array<Object>}      faces
 * @param {!Array<Object>}      uvs
 */
shapy.editor.Object = function(id, scene, verts, edges, faces, uvs) {
  shapy.editor.Editable.call(this, shapy.editor.Editable.Type.OBJECT);

  /** @public {string} */
  this.id = id;
  /** @public {!shapy.editor.Object} */
  this.object = this;
  /** @public {!shapy.Scene} */
  this.scene = scene;

  /**
   * True if the mesh is dirty, needing to be rebuilt.
   * @public {boolean}
   */
  this.dirtyMesh = true;

  /**
   * True if the object was deleted.
   */
  this.deleted = false;

  /**
   * Texture attached to the object.
   * @public {!shapy.editor.Texture}
   */
  this.texture = new shapy.editor.Texture(512, 512);

  /**
   * @private {goog.vec.Vec3}
   */
  this.position_ = goog.vec.Vec3.createFromValues(0, 0, 0);

  /** @private {goog.vec.Vec3} @const */
  this.scale_ = goog.vec.Vec3.createFromValues(1, 1, 1);
  /** @private {goog.vec.Vec3} @const */
  this.translate_ = goog.vec.Vec3.createFromValues(0, 0, 0);

  /** @private {goog.vec.Quaternion.Type} @const */
  this.rotQuat_ = goog.vec.Quaternion.createFloat32FromValues(0, 0, 0, 1);
  /** @private {goog.vec.Mat4.Type} @const */
  this.rotation_ = goog.vec.Mat4.createFloat32();

  /**
   * Cached model matrix, computed from scale, rotate and translate.
   * @private {goog.vec.Mat4} @const
   */
  this.model_ = goog.vec.Mat4.createFloat32();
  goog.vec.Mat4.makeIdentity(this.model_);

  /**
   * Cached inverse model matrix, used for raycasting.
   * @private {!goog.vec.Mat4.Type} @const
   */
  this.invModel_ = goog.vec.Mat4.createFloat32();

  /**
   * True if any data field is dirty.
   * @private {boolean}
   */
  this.dirtyData_ = true;

  /**
   * Version number.
   * @private {number}
   */
  this.versionNumber_ = 1;

  /**
   * Colour.
   * @private {number}
   */
  this.colour_ = 0xffffff;

  /**
   * Object Vertex List
   * @public {!Array<shapy.editor.Vertex>}
   * @const
   */
  this.verts = {};
  this.nextVert_ = 0;
  goog.object.forEach(verts, function(v, i) {
    this.nextVert_ = Math.max(this.nextVert_, i + 1);
    this.verts[i] = new shapy.editor.Vertex(this, i, v[0], v[1], v[2]);
  }, this);

  /**
   * Edge List.
   * @public {!Array<shapy.editor.Edge>}
   * @const
   */
  this.edges = {};
  this.nextEdge_ = 0;
  goog.object.forEach(edges, function(e, i) {
    this.nextEdge_ = Math.max(this.nextEdge_, i + 1);
    this.edges[i] = new shapy.editor.Edge(this, i, e[0], e[1]);
  }, this);

  /**
   * Face List
   * Expressed as triples of edge indices indexing this.edges
   * @public {!Array<Array<shapy.editor.Edge>>}
   * @const
   */
   this.faces = {};
   this.nextFace_ = 0;
   goog.object.forEach(faces, function(f, i) {
    this.nextFace_ = Math.max(this.nextFace_, i + 1);
    this.faces[i] = new shapy.editor.Face(
        this, i, f[0], f[1], f[2]);
   }, this);

   /**
    * True if the object has a UV map.
    * @public {!Object<number, !shapy.editor.Object.UV>}
    */
  this.uvs = {};
  this.nextUV_ = 0;
  goog.object.forEach(uvs, function(u, i) {
    this.nextUV_ = Math.max(this.nextUV_, i + 1);
    this.uvs[i] = new shapy.editor.Object.UV(this, i, u[0], u[1]);
  }, this);
  this.projectUV();
};
goog.inherits(shapy.editor.Object, shapy.editor.Editable);


/**
 * Edge distance treshold.
 * @type {number} @const
 */
shapy.editor.Object.EDGE_DIST_TRESHOLD = 0.01;


/**
 * UV distance treshold.
 * @type {number} @const
 */
shapy.editor.Object.UV_DIST_TRESHOLD = 0.01;


/**
 * Recomputes the model matrix.
 */
shapy.editor.Object.prototype.computeModel = function() {
  goog.vec.Mat4.makeIdentity(this.model_);
  goog.vec.Mat4.translate(
      this.model_,
      this.translate_[0], this.translate_[1], this.translate_[2]);
  goog.vec.Quaternion.toRotationMatrix4(
      this.rotQuat_, this.rotation_);
  goog.vec.Mat4.multMat(
      this.model_, this.rotation_, this.model_);
  goog.vec.Mat4.scale(
      this.model_,
      this.scale_[0], this.scale_[1], this.scale_[2]);

  goog.vec.Mat4.invert(this.model_, this.invModel_);
};


/**
 * Translates the object.
 *
 * @param {number} dx
 * @param {number} dy
 * @param {number} dz
 */
shapy.editor.Object.prototype.translate = function(dx, dy, dz) {
  this.translate_[0] += dx;
  this.translate_[1] += dy;
  this.translate_[2] += dz;
};


/**
 * Retrieves the object position.
 *
 * @return {!goog.vec.Vec3.Type}
 */
shapy.editor.Object.prototype.getPosition = function() {
  return this.translate_;
};


/**
 * Sets object position.
 *
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
shapy.editor.Object.prototype.setPosition = function(x, y, z) {
  goog.vec.Vec3.setFromValues(this.translate_, x, y, z);
};


/**
 * Updates the object scale.
 *
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
shapy.editor.Object.prototype.scale = function(x, y, z) {
  this.scale_[0] *= x;
  this.scale_[1] *= y;
  this.scale_[2] *= z;
};


/**
 * Retrieves the object scale.
 *
 * @return {!goog.vec.Vec3.Type}
 */
shapy.editor.Object.prototype.getScale = function() {
  return this.scale_;
};


/**
 * Rotates the editable.
 *
 * @param {goog.vec.Quaternion} q
 */
shapy.editor.Object.prototype.rotate = function(q) {
  goog.vec.Quaternion.concat(q, this.rotQuat_, this.rotQuat_);
};


/**
 * Deletes the object.
 */
shapy.editor.Object.prototype.delete = function() {
  goog.object.remove(this.scene.objects, this.id);
  this.deleted = true;
};


/**
 * Finds all parts that intersect a ray.
 *
 * @param {!goog.vec.Ray} ray
 * @param {!shapy.editor.Mode} mode Selection mode.
 *
 * @return {!Array<shapy.editor.Editable>}
 */
shapy.editor.Object.prototype.pickRay = function(ray, mode) {
  var q = goog.vec.Vec3.createFloat32();
  var v = goog.vec.Vec3.createFloat32();
  var obj = [];

  // Move the ray to model space.
  goog.vec.Mat4.multVec3(this.invModel_, ray.origin, q);
  goog.vec.Mat4.multVec3NoTranslate(this.invModel_, ray.dir, v);
  var r = new goog.vec.Ray(q, v);

  // Pick individual components.
  return [
      this.pickVertices_(r, mode),
      this.pickEdges_(r, mode),
      this.pickFaces_(r, mode),
  ];
};


/**
 * Finds all parts that are inside a frustum.
 *
 * @param {!Array<Object>} frustum
 *
 * @return {!Array<shapy.editor.Editable>}
 */
shapy.editor.Object.prototype.pickFrustum = function(frustum) {
  var transpose = goog.vec.Mat4.createFloat32();
  goog.vec.Mat4.transpose(this.model_, transpose);
  // Transform the clipping planes into model space.
  var planes = goog.array.map(frustum, function(plane) {
    var n = goog.vec.Vec3.cloneFloat32(plane.n);
    var o = goog.vec.Vec3.cloneFloat32(plane.o);
    goog.vec.Mat4.multVec3(this.invModel_, o, o);
    goog.vec.Mat4.multVec3NoTranslate(transpose, n, n);
    goog.vec.Vec3.normalize(n, n);
    return {
      n: n,
      d: -goog.vec.Vec3.dot(o, n)
    };
  }, this);

  // Retrieve all parts of the object.
  var all = goog.array.flatten(goog.array.map([
      this.verts,
      this.edges,
      this.faces
  ], goog.object.getValues));

  // Filter out all the parts which are inside all planes.
  var hits = goog.object.getValues(goog.object.filter(all, function(elem) {
    return goog.array.some(elem.getVertices(), function(v) {
      return goog.array.every(planes, function(plane) {
        return goog.vec.Vec3.dot(v.position, plane.n) + plane.d >= 0;
      });
    });
  }, this));

  // Include current object if any part is hit.
  return goog.array.isEmpty(hits) ? [] : goog.array.concat(hits, this);
};


/**
 * Finds all vertices that intersect a ray.
 *
 * @private
 *
 * @param {!goog.vec.Ray} ray Ray converted to model space.
 *
 * @return {!Array<shapy.editor.Editable>}
 */
shapy.editor.Object.prototype.pickVertices_ = function(ray) {
  var u = goog.vec.Vec3.createFloat32();

  // Find all intersecting vertices.
  var v = goog.object.filter(goog.object.map(this.verts, function(vert) {
    goog.vec.Vec3.subtract(vert.position, ray.origin, u);
    goog.vec.Vec3.cross(ray.dir, u, u);
    if (goog.vec.Vec3.magnitude(u) >= 0.01) {
      return null;
    }

    // Convert the intersection point to world space.
    var p = goog.vec.Vec3.createFloat32();
    goog.vec.Mat4.multVec3(vert.object.model_, vert.position, p);

    return {
      item: vert,
      point: p
    };
  }, this), goog.isDefAndNotNull);
  return goog.object.getValues(v);
};


/**
 * Finds all edges that intersect a ray.
 *
 * @private
 *
 * @param {!goog.vec.Ray} ray Ray converted to model space.
 *
 * @return {!Array<shapy.editor.Editable>}
 */
shapy.editor.Object.prototype.pickEdges_ = function(ray) {
  var u = goog.vec.Vec3.createFloat32();

  // Find all intersecting edges.
  var v = goog.object.filter(goog.object.map(this.edges, function(edge) {
    // Find the ray associated with the edge.
    var e0 = this.verts[edge.start].position;
    goog.vec.Vec3.subtract(this.verts[edge.end].position, e0, u);
    var c = shapy.editor.geom.getClosest(new goog.vec.Ray(e0, u), ray);

    if (goog.vec.Vec3.distance(c.p0, c.p1) >= 0.01 || c.s <= 0 || c.s >= 1) {
      return null;
    }

    // Convert the intersection point to world space.
    var p = goog.vec.Vec3.createFloat32();
    goog.vec.Mat4.multVec3(edge.object.model_, c.p0, p);

    return {
      item: edge,
      point: p
    };
  }, this), goog.isDefAndNotNull);
  return goog.object.getValues(v);
};


/**
 * Finds all faces that intersect a ray.
 *
 * @private
 *
 * @param {!goog.vec.Ray} ray Ray converted to model space.
 * @param {!shapy.editor.Mode} mode Selection mode.
 *
 * @return {!Array<shapy.editor.Editable>}
 */
shapy.editor.Object.prototype.pickFaces_ = function(ray, mode) {
  // Find all intersecting faces.
  var v = goog.object.filter(goog.object.map(this.faces, function(face) {
    var t = face.getVertexPositions_();
    var inter = shapy.editor.geom.intersectTriangle(ray, t[0], t[1], t[2]);
    var ed;

    if (!inter) {
      return null;
    }

    var i = inter.i;

    // Convert the intersection point to world space.
    var p = goog.vec.Vec3.createFloat32();
    goog.vec.Mat4.multVec3(this.model_, i, p);

    // Determines if the point is close enough to the edge e.
    var edgeDist = goog.bind(function(e) {
      var edge = this.edges[e > 0 ? e : -e];
      var d = shapy.editor.geom.getDistance(
        p,
        this.verts[edge.start].position,
        this.verts[edge.end].position
      );

      if (d < shapy.editor.Object.EDGE_DIST_TRESHOLD) {
        return {
          item: edge,
          point: p
        };
      }

      return null;
    }, this);

    // Determine if the intersection point is close to an edge.
    return (
      (!mode || !mode.paint) && (
        edgeDist(face.e0) ||
        edgeDist(face.e1) ||
        edgeDist(face.e2)
      ) ||
      {
        item: face,
        point: p
      }
    );
  }, this), goog.isDefAndNotNull, this);
  return goog.object.getValues(v);
};


/**
 * Finds vertices that match given UV coordinate.
 *
 * @param {!{x: number, y: number}} coord
 */
shapy.editor.Object.prototype.pickUVCoord = function(coord) {
  return goog.object.getValues(goog.object.filter(this.uvs, function(uv) {
    return shapy.editor.geom.dist2D(coord, uv.u, uv.v) <
        shapy.editor.Object.UV_DIST_TRESHOLD;
  }, this));
};


/**
 * Finds parts that fall into the given UV region.
 *
 * @param {!{x0: number, x1: number, y0: number, y1: number}} group
 */
shapy.editor.Object.prototype.pickUVGroup = function(group) {
  return goog.object.getValues(goog.object.filter(this.uvs, function(uv) {
    return shapy.editor.geom.intersectSquare(group, uv.u, uv.v);
  }, this));
};


/**
 * Merges a set of points into a single point.
 *
 * @param {!Array<shapy.editor.Vertex>} verts
 *
 * @return {!shapy.editor.Vertex}
 */
shapy.editor.Object.prototype.mergeVertices = function(verts) {
  var center = goog.vec.Vec3.createFloat32FromValues(0, 0, 0);
  var vertID = this.nextVert_;
  this.nextVert_++;

  var vertIDs = goog.array.map(verts, function(vert) {
    goog.vec.Vec3.add(center, vert.position, center);
    return vert.id;
  });
  goog.vec.Vec3.scale(center, 1.0 / verts.length, center);

  // Remove all affected vertices & add the new vertex.
  this.verts = goog.object.filter(this.verts, function(v) {
    return !goog.array.contains(vertIDs, v.id);
  }, this);
  this.verts[vertID] = new shapy.editor.Vertex(
      this, vertID, center[0], center[1], center[2]);

  // Remove all edges & convert some to vertices.
  var faceIDs = [], edge = {}, map = {};
  this.edges = goog.object.filter(this.edges, function(e) {
    e.start = goog.array.contains(vertIDs, e.start) ? vertID : e.start;
    e.end = goog.array.contains(vertIDs, e.end) ? vertID : e.end;

    // If both endpoints were removed, dump the edge.
    if (e.start == e.end) {
      return false;
    }

    // If an identical or an inverse edge was formed, get rid of edge
    if ((edge[e.start] || {})[e.end]) {
      map[e.id] = edge[e.start][e.end];
      return false;
    }
    if ((edge[e.end] || {})[e.start]) {
      map[e.id] = edge[e.end][e.start];
      return false;
    }

    map[e.id] = e.id;
    edge[e.start] = edge[e.start] || {};
    edge[e.start][e.end] = e.id;
    faceIDs.push(e.id);
    return true;
  }, this);

  // Remove faces that had any edges removed.
  this.faces = goog.object.filter(this.faces, function(f) {
    f.e0 = map[f.e0] || -map[-f.e0];
    f.e1 = map[f.e1] || -map[-f.e1];
    f.e2 = map[f.e2] || -map[-f.e2];
    var e0 = goog.array.contains(faceIDs, Math.abs(f.e0));
    var e1 = goog.array.contains(faceIDs, Math.abs(f.e1));
    var e2 = goog.array.contains(faceIDs, Math.abs(f.e2));

    return e0 && e1 && e2;
  }, this);

  this.dirtyMesh = true;
  return this.verts[vertID];
};


/**
 * Projects UV coordinates over a cube.
 */
shapy.editor.Object.prototype.projectUV = function() {
  var n = goog.vec.Vec3.createFloat32();
  var project = goog.bind(function(vert) {
    var u, v, id;

    // Find u & v.
    goog.vec.Vec3.normalize(vert.position, n);
    u = 0.5 + Math.atan2(n[2], n[0]) / (2 * Math.PI);
    v = 0.5 - Math.asin(n[1]) / Math.PI;

    this.dirtyMesh = true;
    id = this.nextUV_;
    this.nextUV_++;
    this.uvs[id] = new shapy.editor.Object.UV(this, id, u, v);
    return id;
  }, this);

  goog.object.forEach(this.faces, function(f) {
    var verts = f.getVertices();
    f.uv0 = f.uv0 || project(verts[0]);
    f.uv1 = f.uv1 || project(verts[1]);
    f.uv2 = f.uv2 || project(verts[2]);
  }, this);
};


/**
 * Connects vertices and edges in order to create new edges or faces.
 *
 * @param {!Array<shapy.editor.Vertex>} verts Vertices to connect.
 */
shapy.editor.Object.prototype.connect = function(verts) {
  var pairs;
  if (verts.length == 2) {
    pairs = [
      [verts[0].id, verts[1].id]
    ];
  } else {
    pairs = [
      [verts[0].id, verts[1].id],
      [verts[1].id, verts[2].id],
      [verts[2].id, verts[0].id]
    ];
  }

  var e = goog.array.map(pairs, function(v) {
    for (var id in this.edges) {
      var e = this.edges[id];
      if ((e.start == v[0] && e.end == v[1]) ||
          (e.start == v[1] && e.end == v[0]))
      {
        return id;
      }
    }

    var edgeID = this.nextEdge_++;
    this.edges[edgeID] = new shapy.editor.Edge(this, edgeID,
        v[0], v[1]);
    this.dirtyMesh = true;
    return edgeID;
  }, this);

  if (verts.length == 3) {
    e.sort();
    var exists = goog.object.some(this.faces, function(f) {
      var v = [f.e0, f.e1, f.e2];
      v.sort();
      return v[0] == e[0] && v[1] == e[1] && v[2] == e[2];
    });
    if (exists) {
      return;
    }
    var faceID = this.nextFace_++;
    this.faces[faceID] = new shapy.editor.Face(this, faceID,
        e[0], e[1], e[2]);
    this.dirtyMesh = true;
  }
};


/**
 * Cuts the object using the plane.
 *
 * @param {!goog.vec.Vec3.Type} n Normal of the plane.
 * @param {!goog.vec.Vec3.Type} p A point in the plance.
 */
shapy.editor.Object.prototype.cut = function(n, p) {
  var u = goog.vec.Vec3.createFloat32();
  var i;

  // Find edges whose endpoints are on different sides of the plane.
  goog.array.forEach(this.edges, function(e) {
    var verts = e.getVertices();

    var d1 = goog.vec.Vec3.dot(n, verts[0]);
    var d2 = goog.vec.Vec3.dot(n, verts[1]);

    // Plane intersects the edge.
    if ((d1 <= 0 && d2 > 0) || (d2 <= 0 && d1 > 0)) {
      // Find the intersection point.
      goog.vec.Vec3.subtract(verts[1], verts[0], u);
      i = shapy.editor.geom.intersectPlane(new goog.vec.Ray(verts[0], u), n, p);

      // Split edge in two.
      var edgeId = this.nextEdge_++;
      e.end = edgeId;
      //...
    }
  }, this);
};


/**
 * Extrude a group of faces
 *
 * @param {!Array<!shapy.editor.Face>} faces
 *
 * @return {!Object} An object containing the extruded faces and the normal
 */
shapy.editor.Object.prototype.extrude = function(faces) {
  // Calculate normal
  var normal = goog.vec.Vec3.createFloat32();
  goog.array.forEach(faces, function(f) {
    goog.vec.Vec3.add(normal, f.calculateNormal(), normal);
  }, this);
  goog.vec.Vec3.normalize(normal, normal);

  // Get the list of edges used in all vertices
  var edges = goog.array.flatten(goog.array.map(faces, function(f) {
    return f.getEdges();
  }, this));

  // Figure out the boundary edges by performing two passes, first to record the
  // counts of each edge, then second to remove edges with count != 1 (as
  // internal edges are defined to be edges shared by 2 faces).
  var edgeCounts = {};
  goog.array.forEach(edges, function(e) {
    if (!goog.object.containsKey(edgeCounts, e.id)) {
      edgeCounts[e.id] = 0;
    }
    edgeCounts[e.id]++;
  });
  var sortedEdges = goog.array.bucket(edges, function(e) {
    if (edgeCounts[e.id] == 1) {
      return 'boundary';
    } else {
      return 'internal';
    }
  });

  if (sortedEdges.internal) {
    goog.array.removeDuplicates(sortedEdges.internal);
  }

  // Compute the vertices
  var verts = goog.array.flatten(goog.array.map(edges, function(e) {
    return e.getVertices();
  }, this));
  goog.array.removeDuplicates(verts);

  // Compute the boundary vertices
  var boundaryVerts =
    goog.array.flatten(goog.array.map(sortedEdges.boundary, function(e) {
      return e.getVertices();
    }, this));
  goog.array.removeDuplicates(boundaryVerts);

  //
  // Extruded faces/edges
  //

  // Clone vertices
  var vertMap = {};
  goog.array.map(verts, function(v) {
    var vertID = this.nextVert_++;
    vertMap[v.id] = vertID;
    this.verts[vertID] = new shapy.editor.Vertex(this, vertID,
      v.position[0],
      v.position[1],
      v.position[2]);
    return this.verts[vertID];
  }, this);

  // Clone edges
  var edgeMap = {};
  goog.array.map(edges, function(e) {
    var edgeID = this.nextEdge_++;
    edgeMap[e.id] = edgeID;
    this.edges[edgeID] = new shapy.editor.Edge(this, edgeID,
      vertMap[e.start], vertMap[e.end]);
    return this.edges[edgeID];
  }, this);

  //
  // Side Faces
  //

  // Build vert pairs
  var vertPairs = goog.array.map(boundaryVerts, function(v) {
    return [v, this.verts[vertMap[v.id]]];
  }, this);

  // Join pairs of vertices with edges
  var joinEdges = goog.array.map(vertPairs, function(p) {
    var edgeID = this.nextEdge_++;
    this.edges[edgeID] = new shapy.editor.Edge(this, edgeID,
      p[0].id, p[1].id);
    return this.edges[edgeID];
  }, this);

  // Create faces joining the extruded faces and original faces
  var findEdge = function(edgeList, a, b) {
    for (var i = 0; i < edgeList.length; i++) {
      if (edgeList[i].start == a && edgeList[i].end == b) {
        return edgeList[i];
      }
    }
    return null;
  };
  goog.array.forEach(sortedEdges.boundary, function(e, i) {
    // If ab is not flipped, it looks like:
    //    B<---A <- extruded
    //    ^ \  ^
    //    |  \ |
    //    b<---a <- origin
    //    Diagonal: B->a
    //
    // If ab is flipped, it looks like:
    //    A--->B <- extruded
    //    ^  / ^
    //    | /  |
    //    a--->b <- origin
    //    Diagonal: B->a
    var ab = e;
    var AB = this.edges[edgeMap[e.id]];
    var aA = findEdge(joinEdges, ab.start, AB.start);
    var bB = findEdge(joinEdges, ab.end, AB.end);

    // Determine whether this edge was flipped
    var flipped;
    goog.array.forEach(faces, function(f) {
      if (f.e0 == ab.id || f.e1 == ab.id || f.e2 == ab.id) {
        flipped = false;
      }
      if (f.e0 == -ab.id || f.e1 == -ab.id || f.e2 == -ab.id) {
        flipped = true;
      }
    }, this);

    // Create diagonal edge
    var edgeID = this.nextEdge_++;
    this.edges[edgeID] = new shapy.editor.Edge(this, edgeID,
      AB.end, ab.start);
    var diagonal = this.edges[edgeID];

    // Fill out faces
    var emitFace = goog.bind(function(a, b, c) {
      var faceID = this.nextFace_++;
      this.faces[faceID] = new shapy.editor.Face(this, faceID, a, b, c);
    }, this);
    if (flipped) {
      emitFace(aA.id, AB.id, diagonal.id);
      emitFace(-bB.id, -ab.id, -diagonal.id);
    } else {
      emitFace(-AB.id, -aA.id, -diagonal.id);
      emitFace(ab.id, bB.id, diagonal.id);
    }
  }, this);

  //
  // End Faces
  //

  // Clone faces
  var faceMap = {};
  var clonedFaces = goog.array.map(faces, function(f) {
    var faceID = this.nextFace_++;
    faceMap[f.id] = faceID;
    this.faces[faceID] = new shapy.editor.Face(this, faceID,
        f.e0 >= 0 ? edgeMap[f.e0] : -edgeMap[-f.e0],
        f.e1 >= 0 ? edgeMap[f.e1] : -edgeMap[-f.e1],
        f.e2 >= 0 ? edgeMap[f.e2] : -edgeMap[-f.e2]);
    f.delete(); // Delete original face
    return this.faces[faceID];
  }, this);

  // Delete internal edges
  if (sortedEdges.internal) {
    goog.array.forEach(sortedEdges.internal, function(e) {
      e.delete();
    });
  }

  this.dirtyMesh = true;

  return {
    normal: normal,
    faces: clonedFaces
  };
};


/**
 * Converts the object to JSON.
 *
 * @return {Object} Serializable object.
 */
shapy.editor.Object.prototype.toJSON = function() {
  var trunc = function(f) {
    return Math.floor(f * 1000) / 1000;
  };

  return {
    id: this.id,

    tx: this.translate_[0],
    ty: this.translate_[1],
    tz: this.translate_[2],

    sx: this.scale_[0],
    sy: this.scale_[1],
    sz: this.scale_[2],

    rx: this.rotation_[0],
    ry: this.rotation_[1],
    rz: this.rotation_[2],
    rw: this.rotation_[3],

    verts: goog.object.map(this.verts, function(v) {
      return [
        trunc(v.position[0]),
        trunc(v.position[1]),
        trunc(v.position[2])
      ];
    }, this),

    uvs: goog.object.map(this.uvs, function(uv) {
      return [
        trunc(uv.u),
        trunc(uv.v)
      ];
    }),

    edges: goog.object.map(this.edges, function(e) {
      return [e.start, e.end];
    }, this),

    faces: goog.object.map(this.faces, function(f) {
      return [f.e0, f.e1, f.e2, f.uv0, f.uv1, f.uv2];
    }, this)
  };
};


/**
 * UV coordinate.
 *
 * @constructor
 * @extends {shapy.editor.Editable}
 *
 * @param {!shapy.editor.Object} object
 * @param {!shapy.editor.Face}   face
 * @param {=number}              opt_u
 * @param {=number}              opt_v
 */
shapy.editor.Object.UV = function(object, face, opt_u, opt_v) {
  shapy.editor.Editable.call(this, shapy.editor.Editable.Type.UV);

  /** @public {!shapy.editor.Object} @const */
  this.object = object;
  /** @public {!shapy.editor.Face} */
  this.face = face;
  /** @public {number} */
  this.u = opt_u || 0.0;
  /** @public {number} */
  this.v = opt_v || 0.0;
};
goog.inherits(shapy.editor.Object.UV, shapy.editor.Editable);
