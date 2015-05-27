// This file is part of the Shapy project.
// Licensing information can be found in the LICENSE file.
// (C) 2015 The Shapy Team. All rights reserved.
goog.provide('shapy.editor.geom');



/**
 * Computes the intersection point between a ray and a plane.
 *
 * @param {!goog.vec.Ray}       ray
 * @param {!goog.vec.Vec3.Type} n
 * @param {!goog.vec.Vec3.Type} o
 *
 * @return {!goog.vec.Vec3.Type}
 */
shapy.editor.geom.intersectPlane = function(ray, n, o) {
  var d = -goog.vec.Vec3.dot(n, o);
  var v = goog.vec.Vec3.cloneFloat32(ray.dir);
  goog.vec.Vec3.scale(
      v,
     -(goog.vec.Vec3.dot(ray.origin, n) + d) / goog.vec.Vec3.dot(ray.dir, n),
      v);
  goog.vec.Vec3.add(v, ray.origin, v);
  return v;
};


/**
 * Determines if the ray intersects the sphere.
 *
 * @param {!goog.vec.Ray}  ray Ray
 * @param {!goog.vec.Vec3} c   Center of the sphere.
 * @param {number}         r   Radius of the sphere.
 */
shapy.editor.geom.intersectSphere = function(ray, c, r) {
  var origC = goog.vec.Vec3.createFloat32();
  goog.vec.Vec3.subtract(c, ray.origin, origC);

  var cross = goog.vec.Vec3.createFloat32();
  goog.vec.Vec3.cross(ray.dir, origC, cross);

  return goog.vec.Vec3.magnitude(cross) <= r;
};


/**
 * Determines if the ray intersects the axis-aligned cube using a modified
 * version of Smits' algorithm.
 *
 * @param {!goog.vec.Ray}  ray Ray
 * @param {!goog.vec.Vec3} c   Center of the cube.
 * @param {number}         a   Length of the edge.
 */
shapy.editor.geom.intersectCube = function(ray, c, a) {
  var tmin, tmax, tymin, tymax, tzmin, zmax, div;

  var min = goog.vec.Vec3.createFloat32();
  goog.vec.Vec3.setFromValues(min, c[0] - a / 2, c[1] - a / 2, c[2] - a / 2);

  var max = goog.vec.Vec3.createFloat32();
  goog.vec.Vec3.setFromValues(max, c[0] + a / 2, c[1] + a / 2, c[2] + a / 2);

  div = 1 / ray.dir[0];

  if (ray.dir[0] >= 0) {
    tmin = (min[0] - ray.origin[0]) * div;
    tmax = (max[0] - ray.origin[0]) * div;
  } else {
    tmin = (max[0] - ray.origin[0]) * div;
    tmax = (min[0] - ray.origin[0]) * div;
  }

  div = 1 / ray.dir[1];

  if (ray.dir[1] >= 0) {
    tymin = (min[1] - ray.origin[1]) * div;
    tymax = (max[1] - ray.origin[1]) * div;
  } else {
    tymin = (max[1] - ray.origin[1]) * div;
    tymax = (min[1] - ray.origin[1]) * div;
  }

  if ((tmin > tymax) || (tymin > tmax)) {
    return false;
  }

  if (tymin > tmin) {
    tmin = tymin;
  }

  if (tymax < tmax) {
    tmax = tymax;
  }

  div = 1 / ray.dir[2];

  if (ray.dir[2] >= 0) {
    tzmin = (min[2] - ray.origin[2]) * div;
    tzmax = (max[2] - ray.origin[2]) * div;
  } else {
    tzmin = (max[2] - ray.origin[2]) * div;
    tzmax = (min[2] - ray.origin[2]) * div;
  }

  if ((tmin > tzmax) || (tzmin > tmax)) {
    return false;
  }

  if (tzmin > tmin) {
    tmin = tzmin;
  }

  if (tzmax < tmax) {
    tmax = tzmax;
  }

  return (tmin < Number.MAX_VALUE) || (tmax > 0.0);
};


/**
 * Computes the intersection point of a ray and a triangle if present.
 * Returns null if the ray does not intersect the triangle.
 *
 * @param {!goog.vec.Ray} ray
 * @param {!goog.vec.Vec3.Type} p0
 * @param {!goog.vec.Vec3.Type} p1
 * @param {!goog.vec.Vec3.Type} p2
 */
shapy.editor.geom.intersectTriangle = function(ray, p0, p1, p2) {
  var u = goog.vec.Vec3.createFloat32();
  var v = goog.vec.Vec3.createFloat32();

  // Compute triangle edge vectors.
  goog.vec.Vec3.subtract(p1, p0, u);
  goog.vec.Vec3.subtract(p2, p0, v);

  // Compute the normal of the plane containing the triangle.
  var n = goog.vec.Vec3.createFloat32();
  goog.vec.Vec3.cross(u, v, n);

  // Determine if the ray is parallel to the triangle.
  var b = goog.vec.Vec3.dot(n, ray.dir);
  if (Math.abs(b) < 0.0001) {
    return null;
  }

  // Get intersection of the ray and the triangle plane.
  var w0 = goog.vec.Vec3.createFloat32();
  goog.vec.Vec3.subtract(ray.origin, p0, w0);
  var a = -goog.vec.Vec3.dot(n, w0);

  var r = a / b;
  if (r < 0.0) {
    return null;
  }

  var i = goog.vec.Vec3.createFloat32();
  goog.vec.Vec3.scale(ray.dir, r, i);
  goog.vec.Vec3.add(i, ray.origin, i);

  // Determine if the intersection point is whithin the triangle.
  var uu = goog.vec.Vec3.dot(u, u);
  var uv = goog.vec.Vec3.dot(u, v);
  var vv = goog.vec.Vec3.dot(v, v);

  var w = goog.vec.Vec3.createFloat32();
  goog.vec.Vec3.subtract(i, p0, w);

  var wu = goog.vec.Vec3.dot(w, u);
  var wv = goog.vec.Vec3.dot(w, v);
  var d  = uv * uv - uu * vv;

  var s = (uv * wv - vv * wu) / d;

  if (s < 0.0 || s > 1.0) {
    return null;
  }

  var t = (uv * wu - uu * wv) / d;

  if (t < 0.0 || (s + t) > 1.0) {
    return null;
  }

  return i;
};


/**
 * Computes the centroid of the triangle.
 *
 * @param {!goog.vec.Vec3.Type} p0
 * @param {!goog.vec.Vec3.Type} p1
 * @param {!goog.vec.Vec3.Type} p2
 */
shapy.editor.geom.getCentroid = function(p0, p1, p2) {
  var g = goog.vec.Vec3.createFloat32();

  goog.vec.Vec3.add(p0, p1, g);
  goog.vec.Vec3.add(g, p2, g);
  goog.vec.Vec3.scale(g, 1/3, g);

  return g;
};