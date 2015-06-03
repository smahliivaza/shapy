// This file is part of the Shapy project.
// Licensing information can be found in the LICENSE file.
// (C) 2015 The Shapy Team. All rights reserved.
goog.provide('shapy.browser.Service');

goog.require('shapy.browser.Asset');
goog.require('shapy.browser.Asset.Dir');
goog.require('shapy.browser.Asset.Scene');
goog.require('shapy.browser.Asset.Texture');



/**
 * Service that handles asset browsing.
 *
 *
 * @constructor
 * @ngInject
 *
 * @param {!angular.$http}           $http   The angular http service.
 * @param {!angular.$q}              $q      The angular promise service.
 * @param {!shapy.modal.Service}     shModal The modal service.
 */
shapy.browser.Service = function($http, $q, shModal) {
  /** @private {!angular.$http} @const */
  this.http_ = $http;
  /** @private {!angular.$q} @const */
  this.q_ = $q;

  /*
   * Cached scenes.
   * @private {!Object<string, shapy.browser.Asset.Scene>} @const
   */
  this.scenes_ = {};

  /**
   * Cached directories.
   * @private {!Object<string, shapy.browser.Asset.Dir>} @const
   */
  this.dirs_ = {};

  /**
   * Cached textures.
   * @private {!Object<string, shapy.browser.Asset.Texture>} @const
   */
  this.textures_ = {};

  /**
   * Private home dir.
   *
   * @public {shapy.browser.Asset.Dir}
   * @const
   */
  this.home = null;

  /**
   * Current directory.
   * @public {shapy.browser.Asset.Dir}
   */
  this.current = null;


  /**
   * Type of current directory.
   * @type {boolean}
   * @public
   * @export
   */
  this.public = false;

  /**
   * Path to current folder.
   * @public {Array.<shapy.browser.Asset.Dir>}
   * @export
   */
  this.path = [];

  /**
   * Query from user filtering assets.
   * @public {string}
   * @export
   */
  this.query = '';
};

/**
 * Updates data regarding current directory.
 *
 * @param {!shapy.browser.Asset.Dir} dir Dir entered.
 */
shapy.browser.Service.prototype.changeDirectory = function(dir) {
  // Update current dir and its type.
  this.current = dir;
  this.public = dir.id < 0;

  // If entered private dir, update path.
  if (!this.public) {
    // Compose new path to current dir.
    var newPath = [dir];
    var current = dir;
    while (current.parent !== null) {
      current = current.parent;
      newPath.push(current);
    }
    newPath.reverse();

    this.path = newPath;
  }
};

/**
 * Creates a new asset.
 *
 * @private
 *
 * @param {string}   url  URL of the resource.
 * @param {!Object<string, Object>} cache Cache for the resource.
 * @param {Function} cons Asset constructor.
 *
 * @return {!angular.$q} Promise to return a new asset.
 */
shapy.browser.Service.prototype.create_ = function(url, cache, cons) {
  var parent = this.current;
  // Request new asset from server.
  return this.http_.post(url, { parent: parent.id })
      .then(goog.bind(function(response) {
        // Create asset representation, cache it, update parent/child refs.
        var asset = new cons(this, response.data.id, response.data);
        cache[asset.id] = asset;
        parent.children.push(asset);
        asset.parent = parent;
      }, this));
};


/**
 * Creates new dir.
 *
 * @return {!angular.$q} Promise to return a new dir.
 */
shapy.browser.Service.prototype.createDir = function() {
  return this.create_('/api/assets/dir', this.dirs_, shapy.browser.Asset.Dir);
};


/**
 * Creates a new scene.
 *
 * @return {!angular.$q} Promise to return a new scene.
 */
shapy.browser.Service.prototype.createScene = function() {
  return this.create_(
      '/api/assets/scene',
      this.scenes_,
      shapy.browser.Asset.Scene);
};


/**
 * Creates a new texture.
 *
 * @return {!angular.$q} Promise to return a new texture.
 */
shapy.browser.Service.prototype.createTexture = function() {
  return this.create_(
      '/api/assets/texture',
      this.textures_,
      shapy.browser.Asset.Texture);
};




/**
 * Fetches asset.
 *
 * @private
 *
 * @param {string}                  url   URL of the resource.
 * @param {!Object<string, Object>} cache Cache for the resource.
 * @param {Function}                cons  Asset constructor.
 * @param {string}                  id    ID of the resource.
 *
 * @return {!angular.$q}
 */
shapy.browser.Service.prototype.get_ = function(url, cache, cons, id) {
  if (!goog.isDef(id)) {
    return this.q_.reject({ error: 'Invalid ID.' });
  }

  var asset;
  // Check cache.
  if (goog.object.containsKey(cache, id)) {
    asset = cache[id];
    // Return if asset loaded.
    if (asset.ready) {
      return asset.ready.promise;
    }
  } else {
    // Construct (unloaded) asset.
    asset = new cons(this, id);
    cache[id] = asset;
  }

  var params = (id == -1) ? {} : { id: id };
  // Request asset data from server.
  asset.ready = this.q_.defer();
  this.http_.get(url, {params: params})
    .then(goog.bind(function(response) {
      asset.load(response.data);
      asset.ready.resolve(asset);
    }, this), function() {
      asset.ready.reject();
    });

  return asset.ready.promise;
};


/**
 * Fetches a dir from the server or from local storage.
 *
 * @param {number} dirID ID of the directory.
 *
 * @return {!angular.$q}
 */
shapy.browser.Service.prototype.getDir = function(dirID) {
  return this.get_(
      '/api/assets/dir',
      this.dirs_,
      shapy.browser.Asset.Dir,
      dirID
  );
};


/**
 * Fetches a scene from the server or from local storage.
 *
 * @param {number} sceneID ID of the scene.
 *
 * @return {!angular.$q} Promise to return the scene.
 */
shapy.browser.Service.prototype.getScene = function(sceneID) {
  return this.get_(
      '/api/assets/scene',
      this.scenes_,
      shapy.browser.Asset.Scene,
      sceneID
  );
};


/**
 * Fetches a texture from the server or from local storage.
 *
 * @param {number} textureID ID of the scene.
 *
 * @return {!angular.$q} Promise to return the scene.
 */
shapy.browser.Service.prototype.getTexture = function(textureID) {
  return this.get_(
      '/api/assets/textures',
      this.textures_,
      shapy.browser.Asset.Texture,
      textureID
  );
};

/**
 * Fetches public space from the server or from local storage.
 *
 * @return {!angular.$q}
 */
shapy.browser.Service.prototype.getPublic = function() {
  return this.get_(
      '/api/assets/public',
      this.dirs_,
      shapy.browser.Asset.Dir,
      -1
  );
};

/**
 * Renames asset.
 *
 * @param {string}               url   URL of the resource.
 * @param {!shapy.browser.Asset} asset Asset to rename.
 * @param {string}               name  New name.
 */
shapy.browser.Service.prototype.rename_ = function(url, asset, name) {
  asset.name = name;
  this.http_.put(url, {
    id: asset.id,
    name: name
  });
};

/**
 * Renames dir.
 *
 * @param {!shapy.browser.Asset.Dir} dir  Dir to rename.
 * @param {string}                   name New name.
 */
shapy.browser.Service.prototype.renameDir = function(dir, name) {
  this.rename_('/api/assets/dir', dir, name);
};

/**
 * Renames scene.
 *
 * @param {!shapy.browser.Asset.Scene} scene Scene to rename.
 * @param {string}                     name  New name.
 */
shapy.browser.Service.prototype.renameScene = function(scene, name) {
  this.rename_('/api/assets/scene', scene, name);
};

/**
 * Deletes asset.
 *
 * @param {string}                  url   URL of the resource.
 * @param {!shapy.browser.Asset}    asset Asset to rename.
 * @param {!Object<string, Object>} cache Cache for the resource.
 */
shapy.browser.Service.prototype.delete_ = function(url, asset, cache) {
  // Early return for faulty deletes
  if (asset.id <= 0)
    return;

  // Delete on server
  this.http_.delete(url, {params: {id: asset.id}}).then(goog.bind(function() {
    // Update parent
    this.current.children = this.current.children.filter(function(child) {
      return asset.id !== child.id;
    });
    // Clean cache
    this.removefromCache(asset);
  }, this));
};


/**
 * Recursively removes assets from caches
 *
 * @param {!shapy.browser.Asset}    asset Asset which (with children) we remove.
 */
shapy.browser.Service.prototype.removefromCache = function(asset) {
  switch (asset.type) {
    case shapy.browser.Asset.Type.DIRECTORY:
      goog.object.remove(asset.shBrowser_.dirs_, asset.id);
      break;
    case shapy.browser.Asset.Type.SCENE:
      goog.object.remove(asset.shBrowser_.scenes_, asset.id);
      break;
    case shapy.browser.Asset.Type.TEXTURE:
      goog.object.remove(asset.shBrowser_.textures_, asset.id);
      break;
  }
  if (asset.children) {
    goog.array.forEach(asset.children, asset.shBrowser_.removefromCache);
  }
};

/**
 * Deletes dir.
 *
 * @param {!shapy.browser.Asset.Dir} dir  Dir to delete.
 */
shapy.browser.Service.prototype.deleteDir = function(dir) {
  this.delete_('/api/assets/dir', dir, this.dirs_);
};

/**
 * Deletes scene.
 *
 * @param {!shapy.browser.Asset.Scene} scene Scene to delete.
 */
shapy.browser.Service.prototype.deleteScene = function(scene) {
  this.delete_('/api/assets/scene', scene, this.scenes_);
};

