(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
var _ = require('underscore');

/*global navigator: false */
module.exports = function(AV) {
  var PUBLIC_KEY = "*";

  /**
   * Creates a new ACL.
   * If no argument is given, the ACL has no permissions for anyone.
   * If the argument is a AV.User, the ACL will have read and write
   *   permission for only that user.
   * If the argument is any other JSON object, that object will be interpretted
   *   as a serialized ACL created with toJSON().
   * @see AV.Object#setACL
   * @class
   *
   * <p>An ACL, or Access Control List can be added to any
   * <code>AV.Object</code> to restrict access to only a subset of users
   * of your application.</p>
   */
  AV.ACL = function(arg1) {
    var self = this;
    self.permissionsById = {};
    if (_.isObject(arg1)) {
      if (arg1 instanceof AV.User) {
        self.setReadAccess(arg1, true);
        self.setWriteAccess(arg1, true);
      } else {
        if (_.isFunction(arg1)) {
          throw "AV.ACL() called with a function.  Did you forget ()?";
        }
        AV._objectEach(arg1, function(accessList, userId) {
          if (!_.isString(userId)) {
            throw "Tried to create an ACL with an invalid userId.";
          }
          self.permissionsById[userId] = {};
          AV._objectEach(accessList, function(allowed, permission) {
            if (permission !== "read" && permission !== "write") {
              throw "Tried to create an ACL with an invalid permission type.";
            }
            if (!_.isBoolean(allowed)) {
              throw "Tried to create an ACL with an invalid permission value.";
            }
            self.permissionsById[userId][permission] = allowed;
          });
        });
      }
    }
  };

  /**
   * Returns a JSON-encoded version of the ACL.
   * @return {Object}
   */
  AV.ACL.prototype.toJSON = function() {
    return _.clone(this.permissionsById);
  };

  AV.ACL.prototype._setAccess = function(accessType, userId, allowed) {
    if (userId instanceof AV.User) {
      userId = userId.id;
    } else if (userId instanceof AV.Role) {
      userId = "role:" + userId.getName();
    }
    if (!_.isString(userId)) {
      throw "userId must be a string.";
    }
    if (!_.isBoolean(allowed)) {
      throw "allowed must be either true or false.";
    }
    var permissions = this.permissionsById[userId];
    if (!permissions) {
      if (!allowed) {
        // The user already doesn't have this permission, so no action needed.
        return;
      } else {
        permissions = {};
        this.permissionsById[userId] = permissions;
      }
    }

    if (allowed) {
      this.permissionsById[userId][accessType] = true;
    } else {
      delete permissions[accessType];
      if (_.isEmpty(permissions)) {
        delete permissions[userId];
      }
    }
  };

  AV.ACL.prototype._getAccess = function(accessType, userId) {
    if (userId instanceof AV.User) {
      userId = userId.id;
    } else if (userId instanceof AV.Role) {
      userId = "role:" + userId.getName();
    }
    var permissions = this.permissionsById[userId];
    if (!permissions) {
      return false;
    }
    return permissions[accessType] ? true : false;
  };

  /**
   * Set whether the given user is allowed to read this object.
   * @param userId An instance of AV.User or its objectId.
   * @param {Boolean} allowed Whether that user should have read access.
   */
  AV.ACL.prototype.setReadAccess = function(userId, allowed) {
    this._setAccess("read", userId, allowed);
  };

  /**
   * Get whether the given user id is *explicitly* allowed to read this object.
   * Even if this returns false, the user may still be able to access it if
   * getPublicReadAccess returns true or a role that the user belongs to has
   * write access.
   * @param userId An instance of AV.User or its objectId, or a AV.Role.
   * @return {Boolean}
   */
  AV.ACL.prototype.getReadAccess = function(userId) {
    return this._getAccess("read", userId);
  };

  /**
   * Set whether the given user id is allowed to write this object.
   * @param userId An instance of AV.User or its objectId, or a AV.Role..
   * @param {Boolean} allowed Whether that user should have write access.
   */
  AV.ACL.prototype.setWriteAccess = function(userId, allowed) {
    this._setAccess("write", userId, allowed);
  };

  /**
   * Get whether the given user id is *explicitly* allowed to write this object.
   * Even if this returns false, the user may still be able to write it if
   * getPublicWriteAccess returns true or a role that the user belongs to has
   * write access.
   * @param userId An instance of AV.User or its objectId, or a AV.Role.
   * @return {Boolean}
   */
  AV.ACL.prototype.getWriteAccess = function(userId) {
    return this._getAccess("write", userId);
  };

  /**
   * Set whether the public is allowed to read this object.
   * @param {Boolean} allowed
   */
  AV.ACL.prototype.setPublicReadAccess = function(allowed) {
    this.setReadAccess(PUBLIC_KEY, allowed);
  };

  /**
   * Get whether the public is allowed to read this object.
   * @return {Boolean}
   */
  AV.ACL.prototype.getPublicReadAccess = function() {
    return this.getReadAccess(PUBLIC_KEY);
  };

  /**
   * Set whether the public is allowed to write this object.
   * @param {Boolean} allowed
   */
  AV.ACL.prototype.setPublicWriteAccess = function(allowed) {
    this.setWriteAccess(PUBLIC_KEY, allowed);
  };

  /**
   * Get whether the public is allowed to write this object.
   * @return {Boolean}
   */
  AV.ACL.prototype.getPublicWriteAccess = function() {
    return this.getWriteAccess(PUBLIC_KEY);
  };

  /**
   * Get whether users belonging to the given role are allowed
   * to read this object. Even if this returns false, the role may
   * still be able to write it if a parent role has read access.
   *
   * @param role The name of the role, or a AV.Role object.
   * @return {Boolean} true if the role has read access. false otherwise.
   * @throws {String} If role is neither a AV.Role nor a String.
   */
  AV.ACL.prototype.getRoleReadAccess = function(role) {
    if (role instanceof AV.Role) {
      // Normalize to the String name
      role = role.getName();
    }
    if (_.isString(role)) {
      return this.getReadAccess("role:" + role);
    }
    throw "role must be a AV.Role or a String";
  };

  /**
   * Get whether users belonging to the given role are allowed
   * to write this object. Even if this returns false, the role may
   * still be able to write it if a parent role has write access.
   *
   * @param role The name of the role, or a AV.Role object.
   * @return {Boolean} true if the role has write access. false otherwise.
   * @throws {String} If role is neither a AV.Role nor a String.
   */
  AV.ACL.prototype.getRoleWriteAccess = function(role) {
    if (role instanceof AV.Role) {
      // Normalize to the String name
      role = role.getName();
    }
    if (_.isString(role)) {
      return this.getWriteAccess("role:" + role);
    }
    throw "role must be a AV.Role or a String";
  };

  /**
   * Set whether users belonging to the given role are allowed
   * to read this object.
   *
   * @param role The name of the role, or a AV.Role object.
   * @param {Boolean} allowed Whether the given role can read this object.
   * @throws {String} If role is neither a AV.Role nor a String.
   */
  AV.ACL.prototype.setRoleReadAccess = function(role, allowed) {
    if (role instanceof AV.Role) {
      // Normalize to the String name
      role = role.getName();
    }
    if (_.isString(role)) {
      this.setReadAccess("role:" + role, allowed);
      return;
    }
    throw "role must be a AV.Role or a String";
  };

  /**
   * Set whether users belonging to the given role are allowed
   * to write this object.
   *
   * @param role The name of the role, or a AV.Role object.
   * @param {Boolean} allowed Whether the given role can write this object.
   * @throws {String} If role is neither a AV.Role nor a String.
   */
  AV.ACL.prototype.setRoleWriteAccess = function(role, allowed) {
    if (role instanceof AV.Role) {
      // Normalize to the String name
      role = role.getName();
    }
    if (_.isString(role)) {
      this.setWriteAccess("role:" + role, allowed);
      return;
    }
    throw "role must be a AV.Role or a String";
  };

};

},{"underscore":28}],2:[function(require,module,exports){
(function (global){
/*!
 * AVOSCloud JavaScript SDK
 * Built: Mon Jun 03 2013 13:45:00
 * https://leancloud.cn
 *
 * Copyright 2015 LeanCloud.cn, Inc.
 * The AVOS Cloud JavaScript SDK is freely distributable under the MIT license.
 */

var AV = {};

AV._ = require('underscore');
AV.VERSION = require('./version');
AV.Promise = require('./promise');
AV.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
AV.localStorage = require('localStorage');

// 以下模块为了兼容原有代码，使用这种加载方式。
// The module order is important.
require('./utils')(AV);
require('./error')(AV);
require('./event')(AV);
require('./geopoint')(AV);
require('./acl')(AV);
require('./op')(AV);
require('./relation')(AV);
require('./file')(AV);
require('./object')(AV);
require('./role')(AV);
require('./user')(AV);
require('./query')(AV);
require('./cloudfunction')(AV);
require('./push')(AV);
require('./status')(AV);
require('./search')(AV);
require('./insight')(AV);
require('./bigquery')(AV);

global.AV = AV;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./acl":1,"./bigquery":3,"./cloudfunction":8,"./error":9,"./event":10,"./file":11,"./geopoint":12,"./insight":13,"./object":14,"./op":15,"./promise":16,"./push":17,"./query":18,"./relation":19,"./role":20,"./search":21,"./status":22,"./user":23,"./utils":24,"./version":25,"localStorage":4,"underscore":28,"xmlhttprequest":7}],3:[function(require,module,exports){
'use strict';

module.exports = function(AV) {
  /**
   * @namespace 包含了使用了 LeanCloud
   *  <a href='/docs/leaninsight_guide.html'>离线数据分析功能</a>的函数，本模块已经废弃，
   * 请使用 AV.Insight 。
   * <p><strong><em>
   *   部分函数仅在云引擎运行环境下有效。
   * </em></strong></p>
   */
  Object.defineProperty(AV, "BigQuery", {
    get: function() {
      console.warn("AV.BigQuery is deprecated, please use AV.Insight instead.");
      return AV.Insight;
    },
  });
};

},{}],4:[function(require,module,exports){
(function (global){
'use strict';

module.exports = global.localStorage;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],5:[function(require,module,exports){
'use strict';

var dataURItoBlob = function(dataURI, type) {
  var byteString;

  // 传入的 base64，不是 dataURL
  if (dataURI.indexOf('base64') < 0) {
    byteString = atob(dataURI);
  } else if (dataURI.split(',')[0].indexOf('base64') >= 0) {
    byteString = atob(dataURI.split(',')[1]);
  } else {
    byteString = unescape(dataURI.split(',')[1]);
  }
  // separate out the mime component
  var mimeString = type || dataURI.split(',')[0].split(':')[1].split(';')[0];
  var ia = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i ++) {
      ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ia], {type:mimeString});
};

module.exports = dataURItoBlob;

},{}],6:[function(require,module,exports){
'use strict';

module.exports = function upload(file, AV, saveOptions) {
  //use /files endpoint.
  var self = file;
  var dataFormat;
  self._previousSave = self._source.then(function(data, type) {
    dataFormat = data;
    return self._qiniuToken(type);
  }).then(function(response) {
    self._url = response.url;
    self._bucket = response.bucket;
    self.id = response.objectId;
    //Get the uptoken to upload files to qiniu.
    var uptoken = response.token;

    var data = new FormData();
    data.append("file", dataFormat, self._name);
    data.append("key", self._qiniu_key);
    data.append("token", uptoken);

    var promise = new AV.Promise();
    var handled = false;

    var xhr = new AV.XMLHttpRequest();

    xhr.upload.addEventListener('progress', function(e) {
      if (e.lengthComputable) {
        saveOptions.onProgress && saveOptions.onProgress(e);
      }
    }, false);

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (handled) {
          return;
        }
        handled = true;

        delete self._qiniu_key;
        if (xhr.status >= 200 && xhr.status < 300) {
          var response;
          try {
            response = JSON.parse(xhr.responseText);
          } catch (e) {
            promise.reject(e);
            self.destroy();
          }
          if (response) {
            promise.resolve(self);
          } else {
            promise.reject(response);
          }
        } else {
          promise.reject(xhr);
          self.destroy();
        }
      }
    };
    xhr.open('POST', 'http://upload.qiniu.com', true);
    xhr.send(data);

    return promise;
  });
};

},{}],7:[function(require,module,exports){
(function (global){
'use strict';

exports.XMLHttpRequest = global.XMLHttpRequest;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],8:[function(require,module,exports){
'use strict';

var _ = require('underscore');

module.exports = function(AV) {
  /**
   * @namespace Contains functions for calling and declaring
   * <a href="/docs/cloud_code_guide#functions">cloud functions</a>.
   * <p><strong><em>
   *   Some functions are only available from Cloud Code.
   * </em></strong></p>
   */
  AV.Cloud = AV.Cloud || {};

  _.extend(AV.Cloud, /** @lends AV.Cloud */ {
    /**
     * Makes a call to a cloud function.
     * @param {String} name The function name.
     * @param {Object} data The parameters to send to the cloud function.
     * @param {Object} options A Backbone-style options object
     * options.success, if set, should be a function to handle a successful
     * call to a cloud function.  options.error should be a function that
     * handles an error running the cloud function.  Both functions are
     * optional.  Both functions take a single argument.
     * @return {AV.Promise} A promise that will be resolved with the result
     * of the function.
     */
    run: function(name, data, options) {
      var request = AV._request("functions", name, null, 'POST',
                                   AV._encode(data, null, true));

      return request.then(function(resp) {
        return AV._decode(null, resp).result;
      })._thenRunCallbacks(options);
    },

    /**
     * Make a call to request server date time.
     * @param {Object} options A Backbone-style options object
     * options.success, if set, should be a function to handle a successful
     * call to a cloud function.  options.error should be a function that
     * handles an error running the cloud function.  Both functions are
     * optional.  Both functions take a single argument.
     * @return {AV.Promise} A promise that will be resolved with the result
     * of the function.
     * @since 0.5.9
     */
    getServerDate: function(options) {
      var request = AV._request("date", null, null, 'GET');

      return request.then(function(resp) {
        return AV._decode(null, resp);
      })._thenRunCallbacks(options);
    },

    /**
     * Makes a call to request a sms code for operation verification.
     * @param {Object} data The mobile phone number string or a JSON
     *    object that contains mobilePhoneNumber,template,op,ttl,name etc.
     * @param {Object} options A Backbone-style options object
     * @return {AV.Promise} A promise that will be resolved with the result
     * of the function.
     */
    requestSmsCode: function(data, options){
      if(_.isString(data)) {
        data = { mobilePhoneNumber: data };
      }
      if(!data.mobilePhoneNumber) {
        throw "Missing mobilePhoneNumber.";
      }
      var request = AV._request("requestSmsCode", null, null, 'POST',
                                    data);
      return request._thenRunCallbacks(options);
    },

    /**
     * Makes a call to verify sms code that sent by AV.Cloud.requestSmsCode
     * @param {String} code The sms code sent by AV.Cloud.requestSmsCode
     * @param {phone} phone The mobile phoner number(optional).
     * @param {Object} options A Backbone-style options object
     * @return {AV.Promise} A promise that will be resolved with the result
     * of the function.
     */
    verifySmsCode: function(code, phone, options){
      if(!code)
        throw "Missing sms code.";
      var params = {};
      if(AV._.isString(phone)) {
         params['mobilePhoneNumber'] = phone;
      } else {
        // To be compatible with old versions.
         options = phone;
      }

      var request = AV._request("verifySmsCode", code, null, 'POST',
                                   params);
      return request._thenRunCallbacks(options);
    }
  });
};

},{"underscore":28}],9:[function(require,module,exports){
'use strict';

var _ = require('underscore');

module.exports = function(AV) {

  /**
   * Constructs a new AV.Error object with the given code and message.
   * @param {Number} code An error code constant from <code>AV.Error</code>.
   * @param {String} message A detailed description of the error.
   * @class
   *
   * <p>Class used for all objects passed to error callbacks.</p>
   */
  AV.Error = function(code, message) {
    this.code = code;
    this.message = message;
  };

  _.extend(AV.Error, /** @lends AV.Error */ {
    /**
     * Error code indicating some error other than those enumerated here.
     * @constant
     */
    OTHER_CAUSE: -1,

    /**
     * Error code indicating that something has gone wrong with the server.
     * If you get this error code, it is AV's fault. Contact us at
     * https://avoscloud.com/help
     * @constant
     */
    INTERNAL_SERVER_ERROR: 1,

    /**
     * Error code indicating the connection to the AV servers failed.
     * @constant
     */
    CONNECTION_FAILED: 100,

    /**
     * Error code indicating the specified object doesn't exist.
     * @constant
     */
    OBJECT_NOT_FOUND: 101,

    /**
     * Error code indicating you tried to query with a datatype that doesn't
     * support it, like exact matching an array or object.
     * @constant
     */
    INVALID_QUERY: 102,

    /**
     * Error code indicating a missing or invalid classname. Classnames are
     * case-sensitive. They must start with a letter, and a-zA-Z0-9_ are the
     * only valid characters.
     * @constant
     */
    INVALID_CLASS_NAME: 103,

    /**
     * Error code indicating an unspecified object id.
     * @constant
     */
    MISSING_OBJECT_ID: 104,

    /**
     * Error code indicating an invalid key name. Keys are case-sensitive. They
     * must start with a letter, and a-zA-Z0-9_ are the only valid characters.
     * @constant
     */
    INVALID_KEY_NAME: 105,

    /**
     * Error code indicating a malformed pointer. You should not see this unless
     * you have been mucking about changing internal AV code.
     * @constant
     */
    INVALID_POINTER: 106,

    /**
     * Error code indicating that badly formed JSON was received upstream. This
     * either indicates you have done something unusual with modifying how
     * things encode to JSON, or the network is failing badly.
     * @constant
     */
    INVALID_JSON: 107,

    /**
     * Error code indicating that the feature you tried to access is only
     * available internally for testing purposes.
     * @constant
     */
    COMMAND_UNAVAILABLE: 108,

    /**
     * You must call AV.initialize before using the AV library.
     * @constant
     */
    NOT_INITIALIZED: 109,

    /**
     * Error code indicating that a field was set to an inconsistent type.
     * @constant
     */
    INCORRECT_TYPE: 111,

    /**
     * Error code indicating an invalid channel name. A channel name is either
     * an empty string (the broadcast channel) or contains only a-zA-Z0-9_
     * characters and starts with a letter.
     * @constant
     */
    INVALID_CHANNEL_NAME: 112,

    /**
     * Error code indicating that push is misconfigured.
     * @constant
     */
    PUSH_MISCONFIGURED: 115,

    /**
     * Error code indicating that the object is too large.
     * @constant
     */
    OBJECT_TOO_LARGE: 116,

    /**
     * Error code indicating that the operation isn't allowed for clients.
     * @constant
     */
    OPERATION_FORBIDDEN: 119,

    /**
     * Error code indicating the result was not found in the cache.
     * @constant
     */
    CACHE_MISS: 120,

    /**
     * Error code indicating that an invalid key was used in a nested
     * JSONObject.
     * @constant
     */
    INVALID_NESTED_KEY: 121,

    /**
     * Error code indicating that an invalid filename was used for AVFile.
     * A valid file name contains only a-zA-Z0-9_. characters and is between 1
     * and 128 characters.
     * @constant
     */
    INVALID_FILE_NAME: 122,

    /**
     * Error code indicating an invalid ACL was provided.
     * @constant
     */
    INVALID_ACL: 123,

    /**
     * Error code indicating that the request timed out on the server. Typically
     * this indicates that the request is too expensive to run.
     * @constant
     */
    TIMEOUT: 124,

    /**
     * Error code indicating that the email address was invalid.
     * @constant
     */
    INVALID_EMAIL_ADDRESS: 125,

    /**
     * Error code indicating a missing content type.
     * @constant
     */
    MISSING_CONTENT_TYPE: 126,

    /**
     * Error code indicating a missing content length.
     * @constant
     */
    MISSING_CONTENT_LENGTH: 127,

    /**
     * Error code indicating an invalid content length.
     * @constant
     */
    INVALID_CONTENT_LENGTH: 128,

    /**
     * Error code indicating a file that was too large.
     * @constant
     */
    FILE_TOO_LARGE: 129,

    /**
     * Error code indicating an error saving a file.
     * @constant
     */
    FILE_SAVE_ERROR: 130,

    /**
     * Error code indicating an error deleting a file.
     * @constant
     */
    FILE_DELETE_ERROR: 153,

    /**
     * Error code indicating that a unique field was given a value that is
     * already taken.
     * @constant
     */
    DUPLICATE_VALUE: 137,

    /**
     * Error code indicating that a role's name is invalid.
     * @constant
     */
    INVALID_ROLE_NAME: 139,

    /**
     * Error code indicating that an application quota was exceeded.  Upgrade to
     * resolve.
     * @constant
     */
    EXCEEDED_QUOTA: 140,

    /**
     * Error code indicating that a Cloud Code script failed.
     * @constant
     */
    SCRIPT_FAILED: 141,

    /**
     * Error code indicating that a Cloud Code validation failed.
     * @constant
     */
    VALIDATION_ERROR: 142,

    /**
     * Error code indicating that invalid image data was provided.
     * @constant
     */
    INVALID_IMAGE_DATA: 150,

    /**
     * Error code indicating an unsaved file.
     * @constant
     */
    UNSAVED_FILE_ERROR: 151,

    /**
     * Error code indicating an invalid push time.
     */
    INVALID_PUSH_TIME_ERROR: 152,

    /**
     * Error code indicating that the username is missing or empty.
     * @constant
     */
    USERNAME_MISSING: 200,

    /**
     * Error code indicating that the password is missing or empty.
     * @constant
     */
    PASSWORD_MISSING: 201,

    /**
     * Error code indicating that the username has already been taken.
     * @constant
     */
    USERNAME_TAKEN: 202,

    /**
     * Error code indicating that the email has already been taken.
     * @constant
     */
    EMAIL_TAKEN: 203,

    /**
     * Error code indicating that the email is missing, but must be specified.
     * @constant
     */
    EMAIL_MISSING: 204,

    /**
     * Error code indicating that a user with the specified email was not found.
     * @constant
     */
    EMAIL_NOT_FOUND: 205,

    /**
     * Error code indicating that a user object without a valid session could
     * not be altered.
     * @constant
     */
    SESSION_MISSING: 206,

    /**
     * Error code indicating that a user can only be created through signup.
     * @constant
     */
    MUST_CREATE_USER_THROUGH_SIGNUP: 207,

    /**
     * Error code indicating that an an account being linked is already linked
     * to another user.
     * @constant
     */
    ACCOUNT_ALREADY_LINKED: 208,

    /**
     * Error code indicating that a user cannot be linked to an account because
     * that account's id could not be found.
     * @constant
     */
    LINKED_ID_MISSING: 250,

    /**
     * Error code indicating that a user with a linked (e.g. Facebook) account
     * has an invalid session.
     * @constant
     */
    INVALID_LINKED_SESSION: 251,

    /**
     * Error code indicating that a service being linked (e.g. Facebook or
     * Twitter) is unsupported.
     * @constant
     */
    UNSUPPORTED_SERVICE: 252,
    /**
     * Error code indicating a real error code is unavailable because
     * we had to use an XDomainRequest object to allow CORS requests in
     * Internet Explorer, which strips the body from HTTP responses that have
     * a non-2XX status code.
     * @constant
     */
    X_DOMAIN_REQUEST: 602
  });

};

},{"underscore":28}],10:[function(require,module,exports){
/*global _: false */
module.exports = function(AV) {
  var eventSplitter = /\s+/;
  var slice = Array.prototype.slice;

  /**
   * @class
   *
   * <p>AV.Events is a fork of Backbone's Events module, provided for your
   * convenience.</p>
   *
   * <p>A module that can be mixed in to any object in order to provide
   * it with custom events. You may bind callback functions to an event
   * with `on`, or remove these functions with `off`.
   * Triggering an event fires all callbacks in the order that `on` was
   * called.
   *
   * <pre>
   *     var object = {};
   *     _.extend(object, AV.Events);
   *     object.on('expand', function(){ alert('expanded'); });
   *     object.trigger('expand');</pre></p>
   *
   * <p>For more information, see the
   * <a href="http://documentcloud.github.com/backbone/#Events">Backbone
   * documentation</a>.</p>
   */
  AV.Events = {
    /**
     * Bind one or more space separated events, `events`, to a `callback`
     * function. Passing `"all"` will bind the callback to all events fired.
     */
    on: function(events, callback, context) {

      var calls, event, node, tail, list;
      if (!callback) {
        return this;
      }
      events = events.split(eventSplitter);
      calls = this._callbacks || (this._callbacks = {});

      // Create an immutable callback list, allowing traversal during
      // modification.  The tail is an empty object that will always be used
      // as the next node.
      event = events.shift();
      while (event) {
        list = calls[event];
        node = list ? list.tail : {};
        node.next = tail = {};
        node.context = context;
        node.callback = callback;
        calls[event] = {tail: tail, next: list ? list.next : node};
        event = events.shift();
      }

      return this;
    },

    /**
     * Remove one or many callbacks. If `context` is null, removes all callbacks
     * with that function. If `callback` is null, removes all callbacks for the
     * event. If `events` is null, removes all bound callbacks for all events.
     */
    off: function(events, callback, context) {
      var event, calls, node, tail, cb, ctx;

      // No events, or removing *all* events.
      if (!(calls = this._callbacks)) {
        return;
      }
      if (!(events || callback || context)) {
        delete this._callbacks;
        return this;
      }

      // Loop through the listed events and contexts, splicing them out of the
      // linked list of callbacks if appropriate.
      events = events ? events.split(eventSplitter) : _.keys(calls);
      event = events.shift();
      while (event) {
        node = calls[event];
        delete calls[event];
        if (!node || !(callback || context)) {
          continue;
        }
        // Create a new list, omitting the indicated callbacks.
        tail = node.tail;
        node = node.next;
        while (node !== tail) {
          cb = node.callback;
          ctx = node.context;
          if ((callback && cb !== callback) || (context && ctx !== context)) {
            this.on(event, cb, ctx);
          }
          node = node.next;
        }
        event = events.shift();
      }

      return this;
    },

    /**
     * Trigger one or many events, firing all bound callbacks. Callbacks are
     * passed the same arguments as `trigger` is, apart from the event name
     * (unless you're listening on `"all"`, which will cause your callback to
     * receive the true name of the event as the first argument).
     */
    trigger: function(events) {
      var event, node, calls, tail, args, all, rest;
      if (!(calls = this._callbacks)) {
        return this;
      }
      all = calls.all;
      events = events.split(eventSplitter);
      rest = slice.call(arguments, 1);

      // For each event, walk through the linked list of callbacks twice,
      // first to trigger the event, then to trigger any `"all"` callbacks.
      event = events.shift();
      while (event) {
        node = calls[event];
        if (node) {
          tail = node.tail;
          while ((node = node.next) !== tail) {
            node.callback.apply(node.context || this, rest);
          }
        }
        node = all;
        if (node) {
          tail = node.tail;
          args = [event].concat(rest);
          while ((node = node.next) !== tail) {
            node.callback.apply(node.context || this, args);
          }
        }
        event = events.shift();
      }

      return this;
    }
  };

  /**
   * @function
   */
  AV.Events.bind = AV.Events.on;

  /**
   * @function
   */
  AV.Events.unbind = AV.Events.off;
};

},{}],11:[function(require,module,exports){
(function (global){
'use strict';

var path = require('path');
var _ = require('underscore');

/*jshint bitwise:false *//*global FileReader: true, File: true */
module.exports = function(AV) {
  var b64Digit = function(number) {
    if (number < 26) {
      return String.fromCharCode(65 + number);
    }
    if (number < 52) {
      return String.fromCharCode(97 + (number - 26));
    }
    if (number < 62) {
      return String.fromCharCode(48 + (number - 52));
    }
    if (number === 62) {
      return "+";
    }
    if (number === 63) {
      return "/";
    }
    throw "Tried to encode large digit " + number + " in base64.";
  };

  var encodeBase64 = function(array) {
    var chunks = [];
    chunks.length = Math.ceil(array.length / 3);
    _.times(chunks.length, function(i) {
      var b1 = array[i * 3];
      var b2 = array[i * 3 + 1] || 0;
      var b3 = array[i * 3 + 2] || 0;

      var has2 = (i * 3 + 1) < array.length;
      var has3 = (i * 3 + 2) < array.length;

      chunks[i] = [
        b64Digit((b1 >> 2) & 0x3F),
        b64Digit(((b1 << 4) & 0x30) | ((b2 >> 4) & 0x0F)),
        has2 ? b64Digit(((b2 << 2) & 0x3C) | ((b3 >> 6) & 0x03)) : "=",
        has3 ? b64Digit(b3 & 0x3F) : "="
      ].join("");
    });
    return chunks.join("");
  };

  // A list of file extensions to mime types as found here:
  // http://stackoverflow.com/questions/58510/using-net-how-can-you-find-the-
  //     mime-type-of-a-file-based-on-the-file-signature
  var mimeTypes = {
    ai: "application/postscript",
    aif: "audio/x-aiff",
    aifc: "audio/x-aiff",
    aiff: "audio/x-aiff",
    asc: "text/plain",
    atom: "application/atom+xml",
    au: "audio/basic",
    avi: "video/x-msvideo",
    bcpio: "application/x-bcpio",
    bin: "application/octet-stream",
    bmp: "image/bmp",
    cdf: "application/x-netcdf",
    cgm: "image/cgm",
    "class": "application/octet-stream",
    cpio: "application/x-cpio",
    cpt: "application/mac-compactpro",
    csh: "application/x-csh",
    css: "text/css",
    dcr: "application/x-director",
    dif: "video/x-dv",
    dir: "application/x-director",
    djv: "image/vnd.djvu",
    djvu: "image/vnd.djvu",
    dll: "application/octet-stream",
    dmg: "application/octet-stream",
    dms: "application/octet-stream",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml." +
          "document",
    dotx: "application/vnd.openxmlformats-officedocument.wordprocessingml." +
          "template",
    docm: "application/vnd.ms-word.document.macroEnabled.12",
    dotm: "application/vnd.ms-word.template.macroEnabled.12",
    dtd: "application/xml-dtd",
    dv: "video/x-dv",
    dvi: "application/x-dvi",
    dxr: "application/x-director",
    eps: "application/postscript",
    etx: "text/x-setext",
    exe: "application/octet-stream",
    ez: "application/andrew-inset",
    gif: "image/gif",
    gram: "application/srgs",
    grxml: "application/srgs+xml",
    gtar: "application/x-gtar",
    hdf: "application/x-hdf",
    hqx: "application/mac-binhex40",
    htm: "text/html",
    html: "text/html",
    ice: "x-conference/x-cooltalk",
    ico: "image/x-icon",
    ics: "text/calendar",
    ief: "image/ief",
    ifb: "text/calendar",
    iges: "model/iges",
    igs: "model/iges",
    jnlp: "application/x-java-jnlp-file",
    jp2: "image/jp2",
    jpe: "image/jpeg",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    js: "application/x-javascript",
    kar: "audio/midi",
    latex: "application/x-latex",
    lha: "application/octet-stream",
    lzh: "application/octet-stream",
    m3u: "audio/x-mpegurl",
    m4a: "audio/mp4a-latm",
    m4b: "audio/mp4a-latm",
    m4p: "audio/mp4a-latm",
    m4u: "video/vnd.mpegurl",
    m4v: "video/x-m4v",
    mac: "image/x-macpaint",
    man: "application/x-troff-man",
    mathml: "application/mathml+xml",
    me: "application/x-troff-me",
    mesh: "model/mesh",
    mid: "audio/midi",
    midi: "audio/midi",
    mif: "application/vnd.mif",
    mov: "video/quicktime",
    movie: "video/x-sgi-movie",
    mp2: "audio/mpeg",
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    mpe: "video/mpeg",
    mpeg: "video/mpeg",
    mpg: "video/mpeg",
    mpga: "audio/mpeg",
    ms: "application/x-troff-ms",
    msh: "model/mesh",
    mxu: "video/vnd.mpegurl",
    nc: "application/x-netcdf",
    oda: "application/oda",
    ogg: "application/ogg",
    pbm: "image/x-portable-bitmap",
    pct: "image/pict",
    pdb: "chemical/x-pdb",
    pdf: "application/pdf",
    pgm: "image/x-portable-graymap",
    pgn: "application/x-chess-pgn",
    pic: "image/pict",
    pict: "image/pict",
    png: "image/png",
    pnm: "image/x-portable-anymap",
    pnt: "image/x-macpaint",
    pntg: "image/x-macpaint",
    ppm: "image/x-portable-pixmap",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml." +
          "presentation",
    potx: "application/vnd.openxmlformats-officedocument.presentationml." +
          "template",
    ppsx: "application/vnd.openxmlformats-officedocument.presentationml." +
          "slideshow",
    ppam: "application/vnd.ms-powerpoint.addin.macroEnabled.12",
    pptm: "application/vnd.ms-powerpoint.presentation.macroEnabled.12",
    potm: "application/vnd.ms-powerpoint.template.macroEnabled.12",
    ppsm: "application/vnd.ms-powerpoint.slideshow.macroEnabled.12",
    ps: "application/postscript",
    qt: "video/quicktime",
    qti: "image/x-quicktime",
    qtif: "image/x-quicktime",
    ra: "audio/x-pn-realaudio",
    ram: "audio/x-pn-realaudio",
    ras: "image/x-cmu-raster",
    rdf: "application/rdf+xml",
    rgb: "image/x-rgb",
    rm: "application/vnd.rn-realmedia",
    roff: "application/x-troff",
    rtf: "text/rtf",
    rtx: "text/richtext",
    sgm: "text/sgml",
    sgml: "text/sgml",
    sh: "application/x-sh",
    shar: "application/x-shar",
    silo: "model/mesh",
    sit: "application/x-stuffit",
    skd: "application/x-koan",
    skm: "application/x-koan",
    skp: "application/x-koan",
    skt: "application/x-koan",
    smi: "application/smil",
    smil: "application/smil",
    snd: "audio/basic",
    so: "application/octet-stream",
    spl: "application/x-futuresplash",
    src: "application/x-wais-source",
    sv4cpio: "application/x-sv4cpio",
    sv4crc: "application/x-sv4crc",
    svg: "image/svg+xml",
    swf: "application/x-shockwave-flash",
    t: "application/x-troff",
    tar: "application/x-tar",
    tcl: "application/x-tcl",
    tex: "application/x-tex",
    texi: "application/x-texinfo",
    texinfo: "application/x-texinfo",
    tif: "image/tiff",
    tiff: "image/tiff",
    tr: "application/x-troff",
    tsv: "text/tab-separated-values",
    txt: "text/plain",
    ustar: "application/x-ustar",
    vcd: "application/x-cdlink",
    vrml: "model/vrml",
    vxml: "application/voicexml+xml",
    wav: "audio/x-wav",
    wbmp: "image/vnd.wap.wbmp",
    wbmxl: "application/vnd.wap.wbxml",
    wml: "text/vnd.wap.wml",
    wmlc: "application/vnd.wap.wmlc",
    wmls: "text/vnd.wap.wmlscript",
    wmlsc: "application/vnd.wap.wmlscriptc",
    wrl: "model/vrml",
    xbm: "image/x-xbitmap",
    xht: "application/xhtml+xml",
    xhtml: "application/xhtml+xml",
    xls: "application/vnd.ms-excel",
    xml: "application/xml",
    xpm: "image/x-xpixmap",
    xsl: "application/xml",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xltx: "application/vnd.openxmlformats-officedocument.spreadsheetml." +
          "template",
    xlsm: "application/vnd.ms-excel.sheet.macroEnabled.12",
    xltm: "application/vnd.ms-excel.template.macroEnabled.12",
    xlam: "application/vnd.ms-excel.addin.macroEnabled.12",
    xlsb: "application/vnd.ms-excel.sheet.binary.macroEnabled.12",
    xslt: "application/xslt+xml",
    xul: "application/vnd.mozilla.xul+xml",
    xwd: "image/x-xwindowdump",
    xyz: "chemical/x-xyz",
    zip: "application/zip"
  };

  /**
   * Reads a File using a FileReader.
   * @param file {File} the File to read.
   * @param type {String} (optional) the mimetype to override with.
   * @return {AV.Promise} A Promise that will be fulfilled with a
   *     base64-encoded string of the data and its mime type.
   */
  var readAsync = function(file, type) {
    var promise = new AV.Promise();

    if (typeof(FileReader) === "undefined") {
      return AV.Promise.error(new AV.Error(
          -1, "Attempted to use a FileReader on an unsupported browser."));
    }

    var reader = new FileReader();
    reader.onloadend = function() {
      if (reader.readyState !== 2) {
        promise.reject(new AV.Error(-1, "Error reading file."));
        return;
      }

      var dataURL = reader.result;
      var matches = /^data:([^;]*);base64,(.*)$/.exec(dataURL);
      if (!matches) {
        promise.reject(
            new AV.Error(-1, "Unable to interpret data URL: " + dataURL));
        return;
      }

      promise.resolve(matches[2], type || matches[1]);
    };
    reader.readAsDataURL(file);
    return promise;
  };

  /**
   * A AV.File is a local representation of a file that is saved to the AV
   * cloud.
   * @param name {String} The file's name. This will change to a unique value
   *     once the file has finished saving.
   * @param data {Array} The data for the file, as either:
   *     1. an Array of byte value Numbers, or
   *     2. an Object like { base64: "..." } with a base64-encoded String.
   *     3. a File object selected with a file upload control. (3) only works
   *        in Firefox 3.6+, Safari 6.0.2+, Chrome 7+, and IE 10+.
   *        For example:<pre>
   *     4.a Buffer object in Node.js runtime.
   * var fileUploadControl = $("#profilePhotoFileUpload")[0];
   * if (fileUploadControl.files.length > 0) {
   *   var file = fileUploadControl.files[0];
   *   var name = "photo.jpg";
   *   var parseFile = new AV.File(name, file);
   *   parseFile.save().then(function() {
   *     // The file has been saved to AV.
   *   }, function(error) {
   *     // The file either could not be read, or could not be saved to AV.
   *   });
   * }</pre>
   *
   * @class
   * @param type {String} Optional Content-Type header to use for the file. If
   *     this is omitted, the content type will be inferred from the name's
   *     extension.
   */
  AV.File = function(name, data, type) {
    this._name = name;
    var currentUser = AV.User.current();
    this._metaData = {
       owner: (currentUser != null ? currentUser.id : 'unknown')
    };

    // Guess the content type from the extension if we need to.
    var extension = /\.([^.]*)$/.exec(name);
    if (extension) {
      extension = extension[1].toLowerCase();
    }
    var guessedType = type || mimeTypes[extension] || "text/plain";
    this._guessedType = guessedType;

    if (_.isArray(data)) {
      this._source = AV.Promise.as(encodeBase64(data), guessedType);
      this._metaData.size = data.length;
    } else if (data && data.base64) {
      var parseBase64 = require('./browserify-wrapper/parse-base64');
      var dataBase64 = parseBase64(data.base64, guessedType);
      this._source = AV.Promise.as(dataBase64, guessedType);
    } else if (data && data.blob) {
      this._source = AV.Promise.as(data.blob, guessedType);
    } else if (typeof(File) !== "undefined" && data instanceof File) {
      this._source = AV.Promise.as(data, guessedType);
    } else if(AV._isNode && global.Buffer.isBuffer(data)) {
      // use global.Buffer to prevent browserify pack Buffer module
      this._source = AV.Promise.as(data.toString('base64'), guessedType);
      this._metaData.size = data.length;
    } else if (_.isString(data)) {
      throw "Creating a AV.File from a String is not yet supported.";
    }
  };

  /**
   * Creates a fresh AV.File object with exists url for saving to AVOS Cloud.
   * @param {String} name the file name
   * @param {String} url the file url.
   * @param {Object} metaData the file metadata object,it's optional.
   * @param {String} Optional Content-Type header to use for the file. If
   *     this is omitted, the content type will be inferred from the name's
   *     extension.
   * @return {AV.File} the file object
   */
  AV.File.withURL = function(name, url, metaData, type){
    if(!name || !url){
      throw "Please provide file name and url";
    }
    var file = new AV.File(name, null, type);
    //copy metaData properties to file.
    if(metaData){
      for(var prop in metaData){
        if(!file._metaData[prop])
          file._metaData[prop] = metaData[prop];
      }
    }
    file._url = url;
    //Mark the file is from external source.
    file._metaData['__source'] = 'external';
    return file;
  };

  /**
   * Creates a file object with exists objectId.
   * @param {String} objectId The objectId string
   * @return {AV.File} the file object
   */
  AV.File.createWithoutData = function(objectId){
    var file = new AV.File();
    file.id = objectId;
    return file;
  };

  AV.File.prototype = {

    toJSON: function() {
      return AV._encode(this);
    },

    /**
     * Returns the ACL for this file.
     * @returns {AV.ACL} An instance of AV.ACL.
     */
    getACL: function() {
      return this._acl;
    },

    /**
     * Sets the ACL to be used for this file.
     * @param {AV.ACL} acl An instance of AV.ACL.
     */
    setACL: function(acl) {
        if(!(acl instanceof AV.ACL)) {
          return new AV.Error(AV.Error.OTHER_CAUSE,
                               "ACL must be a AV.ACL.");
        }
        this._acl = acl;
    },

    /**
     * Gets the name of the file. Before save is called, this is the filename
     * given by the user. After save is called, that name gets prefixed with a
     * unique identifier.
     */
    name: function() {
      return this._name;
    },

    /**
     * Gets the url of the file. It is only available after you save the file or
     * after you get the file from a AV.Object.
     * @return {String}
     */
    url: function() {
      return this._url;
    },

    /**
    * <p>Returns the file's metadata JSON object if no arguments is given.Returns the
    * metadata value if a key is given.Set metadata value if key and value are both given.</p>
    * <p><pre>
    *  var metadata = file.metaData(); //Get metadata JSON object.
    *  var size = file.metaData('size');  // Get the size metadata value.
    *  file.metaData('format', 'jpeg'); //set metadata attribute and value.
    *</pre></p>
    * @return {Object} The file's metadata JSON object.
    * @param {String} attr an optional metadata key.
    * @param {Object} value an optional metadata value.
    **/
    metaData: function(attr, value) {
      if(attr != null && value != null){
         this._metaData[attr] = value;
         return this;
      }else if(attr != null){
         return this._metaData[attr];
      }else{
        return this._metaData;
      }
    },

   /**
    * 如果文件是图片，获取图片的缩略图URL。可以传入宽度、高度、质量、格式等参数。
    * @return {String} 缩略图URL
    * @param {Number} width 宽度，单位：像素
    * @param {Number} heigth 高度，单位：像素
    * @param {Number} quality 质量，1-100的数字，默认100
    * @param {Number} scaleToFit 是否将图片自适应大小。默认为true。
    * @param {String} fmt 格式，默认为png，也可以为jpeg,gif等格式。
    */
   thumbnailURL: function(width, height, quality, scaleToFit, fmt){
     if(!this.url()){
       throw "Invalid url.";
     }
     if(!width || !height || width<=0 || height <=0 ){
       throw "Invalid width or height value.";
     }
     quality = quality || 100;
     scaleToFit = (scaleToFit == null) ? true: scaleToFit;
     if(quality<=0 || quality>100){
       throw "Invalid quality value.";
     }
     fmt = fmt || 'png';
     var mode = scaleToFit ? 2: 1;
     return this.url() + '?imageView/' + mode + '/w/' + width + '/h/' + height
       + '/q/' + quality + '/format/' + fmt;
   },

    /**
    * Returns the file's size.
    * @return {Number} The file's size in bytes.
    **/
    size: function(){
      return this.metaData().size;
    },

    /**
     * Returns the file's owner.
     * @return {String} The file's owner id.
     */
    ownerId: function(){
      return this.metaData().owner;
    },
     /**
     * Destroy the file.
     * @return {AV.Promise} A promise that is fulfilled when the destroy
     *     completes.
     */
    destroy: function(options){
      if(!this.id)
        return AV.Promise.error('The file id is not eixsts.')._thenRunCallbacks(options);
      var request = AV._request("files", null, this.id, 'DELETE');
      return request._thenRunCallbacks(options);
    },

    /**
     * Request Qiniu upload token
     * @param {string} type
     * @return {AV.Promise} Resolved with the response
     * @private
     */
    _qiniuToken: function(type) {
      var self = this;
      //Create 16-bits uuid as qiniu key.
      var extName = path.extname(self._name);
      var hexOctet = function() {
        return Math.floor((1+Math.random())*0x10000).toString(16).substring(1);
      };
      var key = hexOctet() + hexOctet() + hexOctet() + hexOctet() + hexOctet()
          + extName;

      var data = {
        key: key,
        ACL: self._acl,
        name:self._name,
        mime_type: type,
        metaData: self._metaData
      };
      if(type && self._metaData.mime_type == null)
        self._metaData.mime_type = type;
      self._qiniu_key = key;
      return AV._request("qiniu", null, null, 'POST', data);
    },

    /**
     * @callback UploadProgressCallback
     * @param {XMLHttpRequestProgressEvent} event - The progress event with 'loaded' and 'total' attributes
     */
    /**
     * Saves the file to the AV cloud.
     * @param {Object} saveOptions
     * @param {UploadProgressCallback} [saveOptions.onProgress]
     * @param {Object} options A Backbone-style options object.
     * @return {AV.Promise} Promise that is resolved when the save finishes.
     */
    save: function() {
      var options = null;
      var saveOptions = {};
      if(arguments.length === 1) {
        options = arguments[0];
      } else if(arguments.length === 2) {
        saveOptions = arguments[0];
        options = arguments[1];
      }
      var self = this;
      if (!self._previousSave) {
        if(self._source) {
          var upload = require('./browserify-wrapper/upload');
          upload(self, AV, saveOptions);
        } else if(self._url && self._metaData['__source'] == 'external') {
          //external link file.
          var data = {
            name: self._name,
            ACL: self._acl,
            metaData: self._metaData,
            mime_type: self._guessedType,
            url: self._url
          };
          self._previousSave = AV._request("files", self._name, null, 'POST', data).then(function(response) {
            self._name = response.name;
            self._url = response.url;
            self.id = response.objectId;
            if(response.size) {
              self._metaData.size = response.size;
            }
            return self;
          });
        }
      }
      return self._previousSave._thenRunCallbacks(options);
    }
  };

};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./browserify-wrapper/parse-base64":5,"./browserify-wrapper/upload":6,"path":26,"underscore":28}],12:[function(require,module,exports){
var _ = require('underscore');

/*global navigator: false */
module.exports = function(AV) {
  /**
   * Creates a new GeoPoint with any of the following forms:<br>
   *   <pre>
   *   new GeoPoint(otherGeoPoint)
   *   new GeoPoint(30, 30)
   *   new GeoPoint([30, 30])
   *   new GeoPoint({latitude: 30, longitude: 30})
   *   new GeoPoint()  // defaults to (0, 0)
   *   </pre>
   * @class
   *
   * <p>Represents a latitude / longitude point that may be associated
   * with a key in a AVObject or used as a reference point for geo queries.
   * This allows proximity-based queries on the key.</p>
   *
   * <p>Only one key in a class may contain a GeoPoint.</p>
   *
   * <p>Example:<pre>
   *   var point = new AV.GeoPoint(30.0, -20.0);
   *   var object = new AV.Object("PlaceObject");
   *   object.set("location", point);
   *   object.save();</pre></p>
   */
  AV.GeoPoint = function(arg1, arg2) {
    if (_.isArray(arg1)) {
      AV.GeoPoint._validate(arg1[0], arg1[1]);
      this.latitude = arg1[0];
      this.longitude = arg1[1];
    } else if (_.isObject(arg1)) {
      AV.GeoPoint._validate(arg1.latitude, arg1.longitude);
      this.latitude = arg1.latitude;
      this.longitude = arg1.longitude;
    } else if (_.isNumber(arg1) && _.isNumber(arg2)) {
      AV.GeoPoint._validate(arg1, arg2);
      this.latitude = arg1;
      this.longitude = arg2;
    } else {
      this.latitude = 0;
      this.longitude = 0;
    }

    // Add properties so that anyone using Webkit or Mozilla will get an error
    // if they try to set values that are out of bounds.
    var self = this;
    if (this.__defineGetter__ && this.__defineSetter__) {
      // Use _latitude and _longitude to actually store the values, and add
      // getters and setters for latitude and longitude.
      this._latitude = this.latitude;
      this._longitude = this.longitude;
      this.__defineGetter__("latitude", function() {
        return self._latitude;
      });
      this.__defineGetter__("longitude", function() {
        return self._longitude;
      });
      this.__defineSetter__("latitude", function(val) {
        AV.GeoPoint._validate(val, self.longitude);
        self._latitude = val;
      });
      this.__defineSetter__("longitude", function(val) {
        AV.GeoPoint._validate(self.latitude, val);
        self._longitude = val;
      });
    }
  };

  /**
   * @lends AV.GeoPoint.prototype
   * @property {float} latitude North-south portion of the coordinate, in range
   *   [-90, 90].  Throws an exception if set out of range in a modern browser.
   * @property {float} longitude East-west portion of the coordinate, in range
   *   [-180, 180].  Throws if set out of range in a modern browser.
   */

  /**
   * Throws an exception if the given lat-long is out of bounds.
   */
  AV.GeoPoint._validate = function(latitude, longitude) {
    if (latitude < -90.0) {
      throw "AV.GeoPoint latitude " + latitude + " < -90.0.";
    }
    if (latitude > 90.0) {
      throw "AV.GeoPoint latitude " + latitude + " > 90.0.";
    }
    if (longitude < -180.0) {
      throw "AV.GeoPoint longitude " + longitude + " < -180.0.";
    }
    if (longitude > 180.0) {
      throw "AV.GeoPoint longitude " + longitude + " > 180.0.";
    }
  };

  /**
   * Creates a GeoPoint with the user's current location, if available.
   * Calls options.success with a new GeoPoint instance or calls options.error.
   * @param {Object} options An object with success and error callbacks.
   */
  AV.GeoPoint.current = function(options) {
    var promise = new AV.Promise();
    navigator.geolocation.getCurrentPosition(function(location) {
      promise.resolve(new AV.GeoPoint({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }));

    }, function(error) {
      promise.reject(error);
    });

    return promise._thenRunCallbacks(options);
  };

  AV.GeoPoint.prototype = {
    /**
     * Returns a JSON representation of the GeoPoint, suitable for AV.
     * @return {Object}
     */
    toJSON: function() {
      AV.GeoPoint._validate(this.latitude, this.longitude);
      return {
        "__type": "GeoPoint",
        latitude: this.latitude,
        longitude: this.longitude
      };
    },

    /**
     * Returns the distance from this GeoPoint to another in radians.
     * @param {AV.GeoPoint} point the other AV.GeoPoint.
     * @return {Number}
     */
    radiansTo: function(point) {
      var d2r = Math.PI / 180.0;
      var lat1rad = this.latitude * d2r;
      var long1rad = this.longitude * d2r;
      var lat2rad = point.latitude * d2r;
      var long2rad = point.longitude * d2r;
      var deltaLat = lat1rad - lat2rad;
      var deltaLong = long1rad - long2rad;
      var sinDeltaLatDiv2 = Math.sin(deltaLat / 2);
      var sinDeltaLongDiv2 = Math.sin(deltaLong / 2);
      // Square of half the straight line chord distance between both points.
      var a = ((sinDeltaLatDiv2 * sinDeltaLatDiv2) +
               (Math.cos(lat1rad) * Math.cos(lat2rad) *
                sinDeltaLongDiv2 * sinDeltaLongDiv2));
      a = Math.min(1.0, a);
      return 2 * Math.asin(Math.sqrt(a));
    },

    /**
     * Returns the distance from this GeoPoint to another in kilometers.
     * @param {AV.GeoPoint} point the other AV.GeoPoint.
     * @return {Number}
     */
    kilometersTo: function(point) {
      return this.radiansTo(point) * 6371.0;
    },

    /**
     * Returns the distance from this GeoPoint to another in miles.
     * @param {AV.GeoPoint} point the other AV.GeoPoint.
     * @return {Number}
     */
    milesTo: function(point) {
      return this.radiansTo(point) * 3958.8;
    }
  };
};

},{"underscore":28}],13:[function(require,module,exports){
'use strict';

var _ = require('underscore');

module.exports = function(AV) {
  /**
   * @namespace 包含了使用了 LeanCloud
   *  <a href='/docs/leaninsight_guide.html'>离线数据分析功能</a>的函数。
   * <p><strong><em>
   *   部分函数仅在云引擎运行环境下有效。
   * </em></strong></p>
   */
  AV.Insight = AV.Insight || {};

  _.extend(AV.Insight, /** @lends AV.Insight */ {

    /**
     * 开始一个 Insight 任务。结果里将返回 Job id，你可以拿得到的 id 使用
     * AV.Insight.JobQuery 查询任务状态和结果。
     * @param {Object} jobConfig 任务配置的 JSON 对象，例如：<code><pre>
     *                   { "sql" : "select count(*) as c,gender from _User group by gender",
     *                     "saveAs": {
     *                         "className" : "UserGender",
     *                         "limit": 1
     *                      }
     *                   }
     *                  </pre></code>
     *               sql 指定任务执行的 SQL 语句， saveAs（可选） 指定将结果保存在哪张表里，limit 最大 1000。
     * @param {Object} options A Backbone-style options object
     * options.success, if set, should be a function to handle a successful
     * call to a cloud function.  options.error should be a function that
     * handles an error running the cloud function.  Both functions are
     * optional.  Both functions take a single argument.
     * @return {AV.Promise} A promise that will be resolved with the result
     * of the function.
     */
    startJob: function(jobConfig, options) {
      if(!jobConfig || !jobConfig.sql) {
        throw new Error('Please provide the sql to run the job.');
      }
      var data = {
        jobConfig: jobConfig,
        appId: AV.applicationId
      };
      var request = AV._request("bigquery", 'jobs', null, 'POST',
                                   AV._encode(data, null, true));

      return request.then(function(resp) {
        return AV._decode(null, resp).id;
      })._thenRunCallbacks(options);
    },

    /**
     * 监听 Insight 任务事件，目前仅支持 end 事件，表示任务完成。
     *  <p><strong><em>
     *     仅在云引擎运行环境下有效。
     *  </em></strong></p>
     * @param {String} event 监听的事件，目前仅支持 'end' ，表示任务完成
     * @param {Function} 监听回调函数，接收 (err, id) 两个参数，err 表示错误信息，
     *                   id 表示任务 id。接下来你可以拿这个 id 使用AV.Insight.JobQuery 查询任务状态和结果。
     *
     */
    on: function(event, cb) {
    }
  });

  /**
   * 创建一个对象，用于查询 Insight 任务状态和结果。
   * @class
   * @param {String} id 任务 id
   * @since 0.5.5
   */
  AV.Insight.JobQuery = function(id, className) {
    if(!id) {
      throw new Error('Please provide the job id.');
    }
    this.id = id;
    this.className = className;
    this._skip = 0;
    this._limit = 100;
  };

  AV.Insight.JobQuery.prototype = {

    /**
     * Sets the number of results to skip before returning any results.
     * This is useful for pagination.
     * Default is to skip zero results.
     * @param {Number} n the number of results to skip.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    skip: function(n) {
      this._skip = n;
      return this;
    },

    /**
     * Sets the limit of the number of results to return. The default limit is
     * 100, with a maximum of 1000 results being returned at a time.
     * @param {Number} n the number of results to limit to.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    limit: function(n) {
      this._limit = n;
      return this;
    },

    /**
     * 查询任务状态和结果，任务结果为一个 JSON 对象，包括 status 表示任务状态， totalCount 表示总数，
     * results 数组表示任务结果数组，previewCount 表示可以返回的结果总数，任务的开始和截止时间
     * startTime、endTime 等信息。
     *
     * @param {Object} options A Backbone-style options object
     * options.success, if set, should be a function to handle a successful
     * call to a cloud function.  options.error should be a function that
     * handles an error running the cloud function.  Both functions are
     * optional.  Both functions take a single argument.
     * @return {AV.Promise} A promise that will be resolved with the result
     * of the function.
     *
     */
    find: function(options) {
      var params = {
        skip: this._skip,
        limit: this._limit
      };

      var request = AV._request("bigquery", 'jobs', this.id, "GET",
                                   params);
      var self = this;
      return request.then(function(response) {
        if(response.error) {
          return AV.Promise.error(new AV.Error(response.code, response.error));
        }
        return AV.Promise.as(response);
      })._thenRunCallbacks(options);
    }

  };

};

},{"underscore":28}],14:[function(require,module,exports){
'use strict';

var _ = require('underscore');

// AV.Object is analogous to the Java AVObject.
// It also implements the same interface as a Backbone model.

module.exports = function(AV) {
  /**
   * Creates a new model with defined attributes. A client id (cid) is
   * automatically generated and assigned for you.
   *
   * <p>You won't normally call this method directly.  It is recommended that
   * you use a subclass of <code>AV.Object</code> instead, created by calling
   * <code>extend</code>.</p>
   *
   * <p>However, if you don't want to use a subclass, or aren't sure which
   * subclass is appropriate, you can use this form:<pre>
   *     var object = new AV.Object("ClassName");
   * </pre>
   * That is basically equivalent to:<pre>
   *     var MyClass = AV.Object.extend("ClassName");
   *     var object = new MyClass();
   * </pre></p>
   *
   * @param {Object} attributes The initial set of data to store in the object.
   * @param {Object} options A set of Backbone-like options for creating the
   *     object.  The only option currently supported is "collection".
   * @see AV.Object.extend
   *
   * @class
   *
   * <p>The fundamental unit of AV data, which implements the Backbone Model
   * interface.</p>
   */
  AV.Object = function(attributes, options) {
    // Allow new AV.Object("ClassName") as a shortcut to _create.
    if (_.isString(attributes)) {
      return AV.Object._create.apply(this, arguments);
    }

    attributes = attributes || {};
    if (options && options.parse) {
      attributes = this.parse(attributes);
    }
    var defaults = AV._getValue(this, 'defaults');
    if (defaults) {
      attributes = _.extend({}, defaults, attributes);
    }
    if (options && options.collection) {
      this.collection = options.collection;
    }

    this._serverData = {};  // The last known data for this object from cloud.
    this._opSetQueue = [{}];  // List of sets of changes to the data.
    this.attributes = {};  // The best estimate of this's current data.

    this._hashedJSON = {};  // Hash of values of containers at last save.
    this._escapedAttributes = {};
    this.cid = _.uniqueId('c');
    this.changed = {};
    this._silent = {};
    this._pending = {};
    if (!this.set(attributes, {silent: true})) {
      throw new Error("Can't create an invalid AV.Object");
    }
    this.changed = {};
    this._silent = {};
    this._pending = {};
    this._hasData = true;
    this._previousAttributes = _.clone(this.attributes);
    this.initialize.apply(this, arguments);
  };

  /**
   * @lends AV.Object.prototype
   * @property {String} id The objectId of the AV Object.
   */

  /**
   * Saves the given list of AV.Object.
   * If any error is encountered, stops and calls the error handler.
   * There are two ways you can call this function.
   *
   * The Backbone way:<pre>
   *   AV.Object.saveAll([object1, object2, ...], {
   *     success: function(list) {
   *       // All the objects were saved.
   *     },
   *     error: function(error) {
   *       // An error occurred while saving one of the objects.
   *     },
   *   });
   * </pre>
   * A simplified syntax:<pre>
   *   AV.Object.saveAll([object1, object2, ...], function(list, error) {
   *     if (list) {
   *       // All the objects were saved.
   *     } else {
   *       // An error occurred.
   *     }
   *   });
   * </pre>
   *
   * @param {Array} list A list of <code>AV.Object</code>.
   * @param {Object} options A Backbone-style callback object.
   */
  AV.Object.saveAll = function(list, options) {
    return AV.Object._deepSaveAsync(list)._thenRunCallbacks(options);
  };

  // Attach all inheritable methods to the AV.Object prototype.
  _.extend(AV.Object.prototype, AV.Events,
           /** @lends AV.Object.prototype */ {
    _existed: false,
    _fetchWhenSave: false,

    /**
     * Initialize is an empty function by default. Override it with your own
     * initialization logic.
     */
    initialize: function(){},

   /**
     * Set whether to enable fetchWhenSave option when updating object.
     * When set true, SDK would fetch the latest object after saving.
     * Default is false.
     * @param {boolean} enable  true to enable fetchWhenSave option.
     */
    fetchWhenSave: function(enable){
      if (!_.isBoolean(enable)) {
        throw "Expect boolean value for fetchWhenSave";
      }
      this._fetchWhenSave = enable;
    },

   /**
    * Returns the object's objectId.
    * @return {String} the objectId.
    */
    getObjectId: function() {
      return this.id;
    },

   /**
    * Returns the object's createdAt attribute.
    * @return {Date}
    */
    getCreatedAt: function() {
      return this.createdAt || this.get('createdAt');
    },

   /**
    * Returns the object's updatedAt attribute.
    * @return {Date}
    */
    getUpdatedAt: function() {
      return this.updatedAt || this.get('updatedAt');
    },

    /**
     * Returns a JSON version of the object suitable for saving to AV.
     * @return {Object}
     */
    toJSON: function() {
      var json = this._toFullJSON();
      AV._arrayEach(["__type", "className"],
                       function(key) { delete json[key]; });
      return json;
    },

    _toFullJSON: function(seenObjects) {
      var json = _.clone(this.attributes);
      AV._objectEach(json, function(val, key) {
        json[key] = AV._encode(val, seenObjects);
      });
      AV._objectEach(this._operations, function(val, key) {
        json[key] = val;
      });

      if (_.has(this, "id")) {
        json.objectId = this.id;
      }
      if (_.has(this, "createdAt")) {
        if (_.isDate(this.createdAt)) {
          json.createdAt = this.createdAt.toJSON();
        } else {
          json.createdAt = this.createdAt;
        }
      }

      if (_.has(this, "updatedAt")) {
        if (_.isDate(this.updatedAt)) {
          json.updatedAt = this.updatedAt.toJSON();
        } else {
          json.updatedAt = this.updatedAt;
        }
      }
      json.__type = "Object";
      json.className = this.className;
      return json;
    },

    /**
     * Updates _hashedJSON to reflect the current state of this object.
     * Adds any changed hash values to the set of pending changes.
     */
    _refreshCache: function() {
      var self = this;
      if (self._refreshingCache) {
        return;
      }
      self._refreshingCache = true;
      AV._objectEach(this.attributes, function(value, key) {
        if (value instanceof AV.Object) {
          value._refreshCache();
        } else if (_.isObject(value)) {
          if (self._resetCacheForKey(key)) {
            self.set(key, new AV.Op.Set(value), { silent: true });
          }
        }
      });
      delete self._refreshingCache;
    },

    /**
     * Returns true if this object has been modified since its last
     * save/refresh.  If an attribute is specified, it returns true only if that
     * particular attribute has been modified since the last save/refresh.
     * @param {String} attr An attribute name (optional).
     * @return {Boolean}
     */
    dirty: function(attr) {
      this._refreshCache();

      var currentChanges = _.last(this._opSetQueue);

      if (attr) {
        return (currentChanges[attr] ? true : false);
      }
      if (!this.id) {
        return true;
      }
      if (_.keys(currentChanges).length > 0) {
        return true;
      }
      return false;
    },

    /**
     * Gets a Pointer referencing this Object.
     */
    _toPointer: function() {
      // if (!this.id) {
      //   throw new Error("Can't serialize an unsaved AV.Object");
      // }
      return { __type: "Pointer",
               className: this.className,
               objectId: this.id };
    },

    /**
     * Gets the value of an attribute.
     * @param {String} attr The string name of an attribute.
     */
    get: function(attr) {
      return this.attributes[attr];
    },

    /**
     * Gets a relation on the given class for the attribute.
     * @param String attr The attribute to get the relation for.
     */
    relation: function(attr) {
      var value = this.get(attr);
      if (value) {
        if (!(value instanceof AV.Relation)) {
          throw "Called relation() on non-relation field " + attr;
        }
        value._ensureParentAndKey(this, attr);
        return value;
      } else {
        return new AV.Relation(this, attr);
      }
    },

    /**
     * Gets the HTML-escaped value of an attribute.
     */
    escape: function(attr) {
      var html = this._escapedAttributes[attr];
      if (html) {
        return html;
      }
      var val = this.attributes[attr];
      var escaped;
      if (AV._isNullOrUndefined(val)) {
        escaped = '';
      } else {
        escaped = _.escape(val.toString());
      }
      this._escapedAttributes[attr] = escaped;
      return escaped;
    },

    /**
     * Returns <code>true</code> if the attribute contains a value that is not
     * null or undefined.
     * @param {String} attr The string name of the attribute.
     * @return {Boolean}
     */
    has: function(attr) {
      return !AV._isNullOrUndefined(this.attributes[attr]);
    },

    /**
     * Pulls "special" fields like objectId, createdAt, etc. out of attrs
     * and puts them on "this" directly.  Removes them from attrs.
     * @param attrs - A dictionary with the data for this AV.Object.
     */
    _mergeMagicFields: function(attrs) {
      // Check for changes of magic fields.
      var model = this;
      var specialFields = ["id", "objectId", "createdAt", "updatedAt"];
      AV._arrayEach(specialFields, function(attr) {
        if (attrs[attr]) {
          if (attr === "objectId") {
            model.id = attrs[attr];
          } else if ((attr === "createdAt" || attr === "updatedAt") &&
                     !_.isDate(attrs[attr])) {
            model[attr] = AV._parseDate(attrs[attr]);
          } else {
            model[attr] = attrs[attr];
          }
          delete attrs[attr];
        }
      });
    },

    /**
     * Returns the json to be sent to the server.
     */
    _startSave: function() {
      this._opSetQueue.push({});
    },

    /**
     * Called when a save fails because of an error. Any changes that were part
     * of the save need to be merged with changes made after the save. This
     * might throw an exception is you do conflicting operations. For example,
     * if you do:
     *   object.set("foo", "bar");
     *   object.set("invalid field name", "baz");
     *   object.save();
     *   object.increment("foo");
     * then this will throw when the save fails and the client tries to merge
     * "bar" with the +1.
     */
    _cancelSave: function() {
      var self = this;
      var failedChanges = _.first(this._opSetQueue);
      this._opSetQueue = _.rest(this._opSetQueue);
      var nextChanges = _.first(this._opSetQueue);
      AV._objectEach(failedChanges, function(op, key) {
        var op1 = failedChanges[key];
        var op2 = nextChanges[key];
        if (op1 && op2) {
          nextChanges[key] = op2._mergeWithPrevious(op1);
        } else if (op1) {
          nextChanges[key] = op1;
        }
      });
      this._saving = this._saving - 1;
    },

    /**
     * Called when a save completes successfully. This merges the changes that
     * were saved into the known server data, and overrides it with any data
     * sent directly from the server.
     */
    _finishSave: function(serverData) {
      // Grab a copy of any object referenced by this object. These instances
      // may have already been fetched, and we don't want to lose their data.
      // Note that doing it like this means we will unify separate copies of the
      // same object, but that's a risk we have to take.
      var fetchedObjects = {};
      AV._traverse(this.attributes, function(object) {
        if (object instanceof AV.Object && object.id && object._hasData) {
          fetchedObjects[object.id] = object;
        }
      });

      var savedChanges = _.first(this._opSetQueue);
      this._opSetQueue = _.rest(this._opSetQueue);
      this._applyOpSet(savedChanges, this._serverData);
      this._mergeMagicFields(serverData);
      var self = this;
      AV._objectEach(serverData, function(value, key) {
        self._serverData[key] = AV._decode(key, value);

        // Look for any objects that might have become unfetched and fix them
        // by replacing their values with the previously observed values.
        var fetched = AV._traverse(self._serverData[key], function(object) {
          if (object instanceof AV.Object && fetchedObjects[object.id]) {
            return fetchedObjects[object.id];
          }
        });
        if (fetched) {
          self._serverData[key] = fetched;
        }
      });
      this._rebuildAllEstimatedData();
      this._saving = this._saving - 1;
    },

    /**
     * Called when a fetch or login is complete to set the known server data to
     * the given object.
     */
    _finishFetch: function(serverData, hasData) {
      // Clear out any changes the user might have made previously.
      this._opSetQueue = [{}];

      // Bring in all the new server data.
      this._mergeMagicFields(serverData);
      var self = this;
      AV._objectEach(serverData, function(value, key) {
        self._serverData[key] = AV._decode(key, value);
      });

      // Refresh the attributes.
      this._rebuildAllEstimatedData();

      // Clear out the cache of mutable containers.
      this._refreshCache();
      this._opSetQueue = [{}];

      this._hasData = hasData;
    },

    /**
     * Applies the set of AV.Op in opSet to the object target.
     */
    _applyOpSet: function(opSet, target) {
      var self = this;
      AV._objectEach(opSet, function(change, key) {
        target[key] = change._estimate(target[key], self, key);
        if (target[key] === AV.Op._UNSET) {
          delete target[key];
        }
      });
    },

    /**
     * Replaces the cached value for key with the current value.
     * Returns true if the new value is different than the old value.
     */
    _resetCacheForKey: function(key) {
      var value = this.attributes[key];
      if (_.isObject(value) &&
          !(value instanceof AV.Object) &&
          !(value instanceof AV.File)) {

        value = value.toJSON ? value.toJSON() : value;
        var json = JSON.stringify(value);
        if (this._hashedJSON[key] !== json) {
          var wasSet = !! this._hashedJSON[key];
          this._hashedJSON[key] = json;
          return wasSet;
        }
      }
      return false;
    },

    /**
     * Populates attributes[key] by starting with the last known data from the
     * server, and applying all of the local changes that have been made to that
     * key since then.
     */
    _rebuildEstimatedDataForKey: function(key) {
      var self = this;
      delete this.attributes[key];
      if (this._serverData[key]) {
        this.attributes[key] = this._serverData[key];
      }
      AV._arrayEach(this._opSetQueue, function(opSet) {
        var op = opSet[key];
        if (op) {
          self.attributes[key] = op._estimate(self.attributes[key], self, key);
          if (self.attributes[key] === AV.Op._UNSET) {
            delete self.attributes[key];
          } else {
            self._resetCacheForKey(key);
          }
        }
      });
    },

    /**
     * Populates attributes by starting with the last known data from the
     * server, and applying all of the local changes that have been made since
     * then.
     */
    _rebuildAllEstimatedData: function() {
      var self = this;

      var previousAttributes = _.clone(this.attributes);

      this.attributes = _.clone(this._serverData);
      AV._arrayEach(this._opSetQueue, function(opSet) {
        self._applyOpSet(opSet, self.attributes);
        AV._objectEach(opSet, function(op, key) {
          self._resetCacheForKey(key);
        });
      });

      // Trigger change events for anything that changed because of the fetch.
      AV._objectEach(previousAttributes, function(oldValue, key) {
        if (self.attributes[key] !== oldValue) {
          self.trigger('change:' + key, self, self.attributes[key], {});
        }
      });
      AV._objectEach(this.attributes, function(newValue, key) {
        if (!_.has(previousAttributes, key)) {
          self.trigger('change:' + key, self, newValue, {});
        }
      });
    },

    /**
     * Sets a hash of model attributes on the object, firing
     * <code>"change"</code> unless you choose to silence it.
     *
     * <p>You can call it with an object containing keys and values, or with one
     * key and value.  For example:<pre>
     *   gameTurn.set({
     *     player: player1,
     *     diceRoll: 2
     *   }, {
     *     error: function(gameTurnAgain, error) {
     *       // The set failed validation.
     *     }
     *   });
     *
     *   game.set("currentPlayer", player2, {
     *     error: function(gameTurnAgain, error) {
     *       // The set failed validation.
     *     }
     *   });
     *
     *   game.set("finished", true);</pre></p>
     *
     * @param {String} key The key to set.
     * @param {} value The value to give it.
     * @param {Object} options A set of Backbone-like options for the set.
     *     The only supported options are <code>silent</code>,
     *     <code>error</code>, and <code>promise</code>.
     * @return {Boolean} true if the set succeeded.
     * @see AV.Object#validate
     * @see AV.Error
     */
    set: function(key, value, options) {
      var attrs, attr;
      if (_.isObject(key) || AV._isNullOrUndefined(key)) {
        attrs = key;
        AV._objectEach(attrs, function(v, k) {
          attrs[k] = AV._decode(k, v);
        });
        options = value;
      } else {
        attrs = {};
        attrs[key] = AV._decode(key, value);
      }

      // Extract attributes and options.
      options = options || {};
      if (!attrs) {
        return this;
      }
      if (attrs instanceof AV.Object) {
        attrs = attrs.attributes;
      }

      // If the unset option is used, every attribute should be a Unset.
      if (options.unset) {
        AV._objectEach(attrs, function(unused_value, key) {
          attrs[key] = new AV.Op.Unset();
        });
      }

      // Apply all the attributes to get the estimated values.
      var dataToValidate = _.clone(attrs);
      var self = this;
      AV._objectEach(dataToValidate, function(value, key) {
        if (value instanceof AV.Op) {
          dataToValidate[key] = value._estimate(self.attributes[key],
                                                self, key);
          if (dataToValidate[key] === AV.Op._UNSET) {
            delete dataToValidate[key];
          }
        }
      });

      // Run validation.
      if (!this._validate(attrs, options)) {
        return false;
      }

      this._mergeMagicFields(attrs);

      options.changes = {};
      var escaped = this._escapedAttributes;
      var prev = this._previousAttributes || {};

      // Update attributes.
      AV._arrayEach(_.keys(attrs), function(attr) {
        var val = attrs[attr];

        // If this is a relation object we need to set the parent correctly,
        // since the location where it was parsed does not have access to
        // this object.
        if (val instanceof AV.Relation) {
          val.parent = self;
        }

        if (!(val instanceof AV.Op)) {
          val = new AV.Op.Set(val);
        }

        // See if this change will actually have any effect.
        var isRealChange = true;
        if (val instanceof AV.Op.Set &&
            _.isEqual(self.attributes[attr], val.value)) {
          isRealChange = false;
        }

        if (isRealChange) {
          delete escaped[attr];
          if (options.silent) {
            self._silent[attr] = true;
          } else {
            options.changes[attr] = true;
          }
        }

        var currentChanges = _.last(self._opSetQueue);
        currentChanges[attr] = val._mergeWithPrevious(currentChanges[attr]);
        self._rebuildEstimatedDataForKey(attr);

        if (isRealChange) {
          self.changed[attr] = self.attributes[attr];
          if (!options.silent) {
            self._pending[attr] = true;
          }
        } else {
          delete self.changed[attr];
          delete self._pending[attr];
        }
      });

      if (!options.silent) {
        this.change(options);
      }
      return this;
    },

    /**
     * Remove an attribute from the model, firing <code>"change"</code> unless
     * you choose to silence it. This is a noop if the attribute doesn't
     * exist.
     */
    unset: function(attr, options) {
      options = options || {};
      options.unset = true;
      return this.set(attr, null, options);
    },

    /**
     * Atomically increments the value of the given attribute the next time the
     * object is saved. If no amount is specified, 1 is used by default.
     *
     * @param attr {String} The key.
     * @param amount {Number} The amount to increment by.
     */
    increment: function(attr, amount) {
      if (_.isUndefined(amount) || _.isNull(amount)) {
        amount = 1;
      }
      return this.set(attr, new AV.Op.Increment(amount));
    },

    /**
     * Atomically add an object to the end of the array associated with a given
     * key.
     * @param attr {String} The key.
     * @param item {} The item to add.
     */
    add: function(attr, item) {
      return this.set(attr, new AV.Op.Add([item]));
    },

    /**
     * Atomically add an object to the array associated with a given key, only
     * if it is not already present in the array. The position of the insert is
     * not guaranteed.
     *
     * @param attr {String} The key.
     * @param item {} The object to add.
     */
    addUnique: function(attr, item) {
      return this.set(attr, new AV.Op.AddUnique([item]));
    },

    /**
     * Atomically remove all instances of an object from the array associated
     * with a given key.
     *
     * @param attr {String} The key.
     * @param item {} The object to remove.
     */
    remove: function(attr, item) {
      return this.set(attr, new AV.Op.Remove([item]));
    },

    /**
     * Returns an instance of a subclass of AV.Op describing what kind of
     * modification has been performed on this field since the last time it was
     * saved. For example, after calling object.increment("x"), calling
     * object.op("x") would return an instance of AV.Op.Increment.
     *
     * @param attr {String} The key.
     * @returns {AV.Op} The operation, or undefined if none.
     */
    op: function(attr) {
      return _.last(this._opSetQueue)[attr];
    },

    /**
     * Clear all attributes on the model, firing <code>"change"</code> unless
     * you choose to silence it.
     */
    clear: function(options) {
      options = options || {};
      options.unset = true;
      var keysToClear = _.extend(this.attributes, this._operations);
      return this.set(keysToClear, options);
    },

    /**
     * Returns a JSON-encoded set of operations to be sent with the next save
     * request.
     */
    _getSaveJSON: function() {
      var json = _.clone(_.first(this._opSetQueue));
      AV._objectEach(json, function(op, key) {
        json[key] = op.toJSON();
      });
      return json;
    },

    /**
     * Returns true if this object can be serialized for saving.
     */
    _canBeSerialized: function() {
      return AV.Object._canBeSerializedAsValue(this.attributes);
    },

    /**
     * Fetch the model from the server. If the server's representation of the
     * model differs from its current attributes, they will be overriden,
     * triggering a <code>"change"</code> event.
     * @param {Object} fetchOptions Optional options to set 'keys' and
     *      'include' option.
     * @param {Object} options Optional Backbone-like options object to be
     *     passed in to set.
     * @return {AV.Promise} A promise that is fulfilled when the fetch
     *     completes.
     */
    fetch: function() {
      var options = null;
      var fetchOptions = {};
      if(arguments.length === 1) {
        options = arguments[0];
      } else if(arguments.length === 2) {
        fetchOptions = arguments[0];
        options = arguments[1];
      }

      var self = this;
      var request = AV._request("classes", this.className, this.id, 'GET',
                                fetchOptions);
      return request.then(function(response, status, xhr) {
        self._finishFetch(self.parse(response, status, xhr), true);
        return self;
      })._thenRunCallbacks(options, this);
    },

    /**
     * Set a hash of model attributes, and save the model to the server.
     * updatedAt will be updated when the request returns.
     * You can either call it as:<pre>
     *   object.save();</pre>
     * or<pre>
     *   object.save(null, options);</pre>
     * or<pre>
     *   object.save(attrs, options);</pre>
     * or<pre>
     *   object.save(key, value, options);</pre>
     *
     * For example, <pre>
     *   gameTurn.save({
     *     player: "Jake Cutter",
     *     diceRoll: 2
     *   }, {
     *     success: function(gameTurnAgain) {
     *       // The save was successful.
     *     },
     *     error: function(gameTurnAgain, error) {
     *       // The save failed.  Error is an instance of AV.Error.
     *     }
     *   });</pre>
     * or with promises:<pre>
     *   gameTurn.save({
     *     player: "Jake Cutter",
     *     diceRoll: 2
     *   }).then(function(gameTurnAgain) {
     *     // The save was successful.
     *   }, function(error) {
     *     // The save failed.  Error is an instance of AV.Error.
     *   });</pre>
     *
     * @return {AV.Promise} A promise that is fulfilled when the save
     *     completes.
     * @see AV.Error
     */
    save: function(arg1, arg2, arg3) {
      var i, attrs, current, options, saved;
      if (_.isObject(arg1) || AV._isNullOrUndefined(arg1)) {
        attrs = arg1;
        options = arg2;
      } else {
        attrs = {};
        attrs[arg1] = arg2;
        options = arg3;
      }

      // Make save({ success: function() {} }) work.
      if (!options && attrs) {
        var extra_keys = _.reject(attrs, function(value, key) {
          return _.include(["success", "error", "wait"], key);
        });
        if (extra_keys.length === 0) {
          var all_functions = true;
          if (_.has(attrs, "success") && !_.isFunction(attrs.success)) {
            all_functions = false;
          }
          if (_.has(attrs, "error") && !_.isFunction(attrs.error)) {
            all_functions = false;
          }
          if (all_functions) {
            // This attrs object looks like it's really an options object,
            // and there's no other options object, so let's just use it.
            return this.save(null, attrs);
          }
        }
      }

      options = _.clone(options) || {};
      if (options.wait) {
        current = _.clone(this.attributes);
      }

      var setOptions = _.clone(options) || {};
      if (setOptions.wait) {
        setOptions.silent = true;
      }
      var setError;
      setOptions.error = function(model, error) {
        setError = error;
      };
      if (attrs && !this.set(attrs, setOptions)) {
        return AV.Promise.error(setError)._thenRunCallbacks(options, this);
      }

      var model = this;

      // If there is any unsaved child, save it first.
      model._refreshCache();



      var unsavedChildren = [];
      var unsavedFiles = [];
      AV.Object._findUnsavedChildren(model.attributes,
                                        unsavedChildren,
                                        unsavedFiles);
      if (unsavedChildren.length + unsavedFiles.length > 0) {
        return AV.Object._deepSaveAsync(this.attributes, model).then(function() {
          return model.save(null, options);
        }, function(error) {
          return AV.Promise.error(error)._thenRunCallbacks(options, model);
        });
      }

      this._startSave();
      this._saving = (this._saving || 0) + 1;

      this._allPreviousSaves = this._allPreviousSaves || AV.Promise.as();
      this._allPreviousSaves = this._allPreviousSaves._continueWith(function() {
        var method = model.id ? 'PUT' : 'POST';

        var json = model._getSaveJSON();

        if(model._fetchWhenSave){
          //Sepcial-case fetchWhenSave when updating object.
          json._fetchWhenSave = true;
        }

        var route = "classes";
        var className = model.className;
        if (model.className === "_User" && !model.id) {
          // Special-case user sign-up.
          route = "users";
          className = null;
        }
        //hook makeRequest in options.
        var makeRequest = options._makeRequest || AV._request;
        var request = makeRequest(route, className, model.id, method, json);

        request = request.then(function(resp, status, xhr) {
          var serverAttrs = model.parse(resp, status, xhr);
          if (options.wait) {
            serverAttrs = _.extend(attrs || {}, serverAttrs);
          }
          model._finishSave(serverAttrs);
          if (options.wait) {
            model.set(current, setOptions);
          }
          return model;

        }, function(error) {
          model._cancelSave();
          return AV.Promise.error(error);

        })._thenRunCallbacks(options, model);

        return request;
      });
      return this._allPreviousSaves;
    },

    /**
     * Destroy this model on the server if it was already persisted.
     * Optimistically removes the model from its collection, if it has one.
     * If `wait: true` is passed, waits for the server to respond
     * before removal.
     *
     * @return {AV.Promise} A promise that is fulfilled when the destroy
     *     completes.
     */
    destroy: function(options) {
      options = options || {};
      var model = this;

      var triggerDestroy = function() {
        model.trigger('destroy', model, model.collection, options);
      };

      if (!this.id) {
        return triggerDestroy();
      }

      if (!options.wait) {
        triggerDestroy();
      }

      var request =
          AV._request("classes", this.className, this.id, 'DELETE');
      return request.then(function() {
        if (options.wait) {
          triggerDestroy();
        }
        return model;
      })._thenRunCallbacks(options, this);
    },

    /**
     * Converts a response into the hash of attributes to be set on the model.
     * @ignore
     */
    parse: function(resp, status, xhr) {
      var output = _.clone(resp);
      _(["createdAt", "updatedAt"]).each(function(key) {
        if (output[key]) {
          output[key] = AV._parseDate(output[key]);
        }
      });
      if (!output.updatedAt) {
        output.updatedAt = output.createdAt;
      }
      if (status) {
        this._existed = (status !== 201);
      }
      return output;
    },

    /**
     * Creates a new model with identical attributes to this one.
     * @return {AV.Object}
     */
    clone: function() {
      return new this.constructor(this.attributes);
    },

    /**
     * Returns true if this object has never been saved to AV.
     * @return {Boolean}
     */
    isNew: function() {
      return !this.id;
    },

    /**
     * Call this method to manually fire a `"change"` event for this model and
     * a `"change:attribute"` event for each changed attribute.
     * Calling this will cause all objects observing the model to update.
     */
    change: function(options) {
      options = options || {};
      var changing = this._changing;
      this._changing = true;

      // Silent changes become pending changes.
      var self = this;
      AV._objectEach(this._silent, function(attr) {
        self._pending[attr] = true;
      });

      // Silent changes are triggered.
      var changes = _.extend({}, options.changes, this._silent);
      this._silent = {};
      AV._objectEach(changes, function(unused_value, attr) {
        self.trigger('change:' + attr, self, self.get(attr), options);
      });
      if (changing) {
        return this;
      }

      // This is to get around lint not letting us make a function in a loop.
      var deleteChanged = function(value, attr) {
        if (!self._pending[attr] && !self._silent[attr]) {
          delete self.changed[attr];
        }
      };

      // Continue firing `"change"` events while there are pending changes.
      while (!_.isEmpty(this._pending)) {
        this._pending = {};
        this.trigger('change', this, options);
        // Pending and silent changes still remain.
        AV._objectEach(this.changed, deleteChanged);
        self._previousAttributes = _.clone(this.attributes);
      }

      this._changing = false;
      return this;
    },

    /**
     * Returns true if this object was created by the AV server when the
     * object might have already been there (e.g. in the case of a Facebook
     * login)
     */
    existed: function() {
      return this._existed;
    },

    /**
     * Determine if the model has changed since the last <code>"change"</code>
     * event.  If you specify an attribute name, determine if that attribute
     * has changed.
     * @param {String} attr Optional attribute name
     * @return {Boolean}
     */
    hasChanged: function(attr) {
      if (!arguments.length) {
        return !_.isEmpty(this.changed);
      }
      return this.changed && _.has(this.changed, attr);
    },

    /**
     * Returns an object containing all the attributes that have changed, or
     * false if there are no changed attributes. Useful for determining what
     * parts of a view need to be updated and/or what attributes need to be
     * persisted to the server. Unset attributes will be set to undefined.
     * You can also pass an attributes object to diff against the model,
     * determining if there *would be* a change.
     */
    changedAttributes: function(diff) {
      if (!diff) {
        return this.hasChanged() ? _.clone(this.changed) : false;
      }
      var changed = {};
      var old = this._previousAttributes;
      AV._objectEach(diff, function(diffVal, attr) {
        if (!_.isEqual(old[attr], diffVal)) {
          changed[attr] = diffVal;
        }
      });
      return changed;
    },

    /**
     * Gets the previous value of an attribute, recorded at the time the last
     * <code>"change"</code> event was fired.
     * @param {String} attr Name of the attribute to get.
     */
    previous: function(attr) {
      if (!arguments.length || !this._previousAttributes) {
        return null;
      }
      return this._previousAttributes[attr];
    },

    /**
     * Gets all of the attributes of the model at the time of the previous
     * <code>"change"</code> event.
     * @return {Object}
     */
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },

    /**
     * Checks if the model is currently in a valid state. It's only possible to
     * get into an *invalid* state if you're using silent changes.
     * @return {Boolean}
     */
    isValid: function() {
      return !this.validate(this.attributes);
    },

    /**
     * You should not call this function directly unless you subclass
     * <code>AV.Object</code>, in which case you can override this method
     * to provide additional validation on <code>set</code> and
     * <code>save</code>.  Your implementation should return
     *
     * @param {Object} attrs The current data to validate.
     * @param {Object} options A Backbone-like options object.
     * @return {} False if the data is valid.  An error object otherwise.
     * @see AV.Object#set
     */
    validate: function(attrs, options) {
      if (_.has(attrs, "ACL") && !(attrs.ACL instanceof AV.ACL)) {
        return new AV.Error(AV.Error.OTHER_CAUSE,
                               "ACL must be a AV.ACL.");
      }
      return false;
    },

    /**
     * Run validation against a set of incoming attributes, returning `true`
     * if all is well. If a specific `error` callback has been passed,
     * call that instead of firing the general `"error"` event.
     */
    _validate: function(attrs, options) {
      if (options.silent || !this.validate) {
        return true;
      }
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validate(attrs, options);
      if (!error) {
        return true;
      }
      if (options && options.error) {
        options.error(this, error, options);
      } else {
        this.trigger('error', this, error, options);
      }
      return false;
    },

    /**
     * Returns the ACL for this object.
     * @returns {AV.ACL} An instance of AV.ACL.
     * @see AV.Object#get
     */
    getACL: function() {
      return this.get("ACL");
    },

    /**
     * Sets the ACL to be used for this object.
     * @param {AV.ACL} acl An instance of AV.ACL.
     * @param {Object} options Optional Backbone-like options object to be
     *     passed in to set.
     * @return {Boolean} Whether the set passed validation.
     * @see AV.Object#set
     */
    setACL: function(acl, options) {
      return this.set("ACL", acl, options);
    }

  });

   /**
    * Creates an instance of a subclass of AV.Object for the give classname
    * and id.
    * @param  {String} className The name of the AV class backing this model.
    * @param {String} id The object id of this model.
    * @return {AV.Object} A new subclass instance of AV.Object.
    */
   AV.Object.createWithoutData = function(className, id, hasData){
     var result = new AV.Object(className);
     result.id = id;
     result._hasData = hasData;
     return result;
   };
   /**
    * Delete objects in batch.The objects className must be the same.
    * @param {Array} The ParseObject array to be deleted.
    * @param {Object} options Standard options object with success and error
    *     callbacks.
    * @return {AV.Promise} A promise that is fulfilled when the save
    *     completes.
    */
   AV.Object.destroyAll = function(objects, options){
      if(objects == null || objects.length == 0){
		  return AV.Promise.as()._thenRunCallbacks(options);
      }
      var className = objects[0].className;
      var id = "";
      var wasFirst = true;
      objects.forEach(function(obj){
        if(obj.className != className)
			  throw "AV.Object.destroyAll requires the argument object array's classNames must be the same";
          if(!obj.id)
              throw "Could not delete unsaved object";
          if(wasFirst){
              id = obj.id;
              wasFirst = false;
          }else{
              id = id + ',' + obj.id;
          }
      });
      var request =
          AV._request("classes", className, id, 'DELETE');
      return request._thenRunCallbacks(options);
   };

  /**
   * Returns the appropriate subclass for making new instances of the given
   * className string.
   */
  AV.Object._getSubclass = function(className) {
    if (!_.isString(className)) {
      throw "AV.Object._getSubclass requires a string argument.";
    }
    var ObjectClass = AV.Object._classMap[className];
    if (!ObjectClass) {
      ObjectClass = AV.Object.extend(className);
      AV.Object._classMap[className] = ObjectClass;
    }
    return ObjectClass;
  };

  /**
   * Creates an instance of a subclass of AV.Object for the given classname.
   */
  AV.Object._create = function(className, attributes, options) {
    var ObjectClass = AV.Object._getSubclass(className);
    return new ObjectClass(attributes, options);
  };

  // Set up a map of className to class so that we can create new instances of
  // AV Objects from JSON automatically.
  AV.Object._classMap = {};

  AV.Object._extend = AV._extend;

  /**
   * Creates a new model with defined attributes,
   * It's the same with
   * <pre>
   *   new AV.Object(attributes, options);
   *  </pre>
   * @param {Object} attributes The initial set of data to store in the object.
   * @param {Object} options A set of Backbone-like options for creating the
   *     object.  The only option currently supported is "collection".
   * @return {AV.Object}
   * @since v0.4.4
   * @see AV.Object
   * @see AV.Object.extend
   */
  AV.Object.new = function(attributes, options){
    return new AV.Object(attributes, options);
  };

  /**
   * Creates a new subclass of AV.Object for the given AV class name.
   *
   * <p>Every extension of a AV class will inherit from the most recent
   * previous extension of that class. When a AV.Object is automatically
   * created by parsing JSON, it will use the most recent extension of that
   * class.</p>
   *
   * <p>You should call either:<pre>
   *     var MyClass = AV.Object.extend("MyClass", {
   *         <i>Instance properties</i>
   *     }, {
   *         <i>Class properties</i>
   *     });</pre>
   * or, for Backbone compatibility:<pre>
   *     var MyClass = AV.Object.extend({
   *         className: "MyClass",
   *         <i>Other instance properties</i>
   *     }, {
   *         <i>Class properties</i>
   *     });</pre></p>
   *
   * @param {String} className The name of the AV class backing this model.
   * @param {Object} protoProps Instance properties to add to instances of the
   *     class returned from this method.
   * @param {Object} classProps Class properties to add the class returned from
   *     this method.
   * @return {Class} A new subclass of AV.Object.
   */
  AV.Object.extend = function(className, protoProps, classProps) {
    // Handle the case with only two args.
    if (!_.isString(className)) {
      if (className && _.has(className, "className")) {
        return AV.Object.extend(className.className, className, protoProps);
      } else {
        throw new Error(
            "AV.Object.extend's first argument should be the className.");
      }
    }

    // If someone tries to subclass "User", coerce it to the right type.
    if (className === "User") {
      className = "_User";
    }

    var NewClassObject = null;
    if (_.has(AV.Object._classMap, className)) {
      var OldClassObject = AV.Object._classMap[className];
      // This new subclass has been told to extend both from "this" and from
      // OldClassObject. This is multiple inheritance, which isn't supported.
      // For now, let's just pick one.
      NewClassObject = OldClassObject._extend(protoProps, classProps);
    } else {
      protoProps = protoProps || {};
      protoProps.className = className;
      NewClassObject = this._extend(protoProps, classProps);
    }
    // Extending a subclass should reuse the classname automatically.
    NewClassObject.extend = function(arg0) {
      if (_.isString(arg0) || (arg0 && _.has(arg0, "className"))) {
        return AV.Object.extend.apply(NewClassObject, arguments);
      }
      var newArguments = [className].concat(AV._.toArray(arguments));
      return AV.Object.extend.apply(NewClassObject, newArguments);
    };
    NewClassObject.new = function(attributes, options){
      return new NewClassObject(attributes, options);
    };
    AV.Object._classMap[className] = NewClassObject;
    return NewClassObject;
  };

  AV.Object._findUnsavedChildren = function(object, children, files) {
    AV._traverse(object, function(object) {
      if (object instanceof AV.Object) {
        object._refreshCache();
        if (object.dirty()) {
          children.push(object);
        }
        return;
      }

      if (object instanceof AV.File) {
        if (!object.url() && !object.id) {
          files.push(object);
        }
        return;
      }
    });
  };

  AV.Object._canBeSerializedAsValue = function(object) {
    var canBeSerializedAsValue = true;

    if (object instanceof AV.Object) {
      canBeSerializedAsValue = !!object.id;

    } else if (_.isArray(object)) {
      AV._arrayEach(object, function(child) {
        if (!AV.Object._canBeSerializedAsValue(child)) {
          canBeSerializedAsValue = false;
        }
      });

    } else if (_.isObject(object)) {
      AV._objectEach(object, function(child) {
        if (!AV.Object._canBeSerializedAsValue(child)) {
          canBeSerializedAsValue = false;
        }
      });
    }

    return canBeSerializedAsValue;
  };

  AV.Object._deepSaveAsync = function(object, model) {
    var unsavedChildren = [];
    var unsavedFiles = [];
    AV.Object._findUnsavedChildren(object, unsavedChildren, unsavedFiles);
    if(model) {
      unsavedChildren = _.filter(unsavedChildren, function(object) {
        return object != model;
      });
    }

    var promise = AV.Promise.as();
    _.each(unsavedFiles, function(file) {
      promise = promise.then(function() {
        return file.save();
      });
    });

    var objects = _.uniq(unsavedChildren);
    var remaining = _.uniq(objects);

    return promise.then(function() {
      return AV.Promise._continueWhile(function() {
        return remaining.length > 0;
      }, function() {

        // Gather up all the objects that can be saved in this batch.
        var batch = [];
        var newRemaining = [];
        AV._arrayEach(remaining, function(object) {
          // Limit batches to 20 objects.
          if (batch.length > 20) {
            newRemaining.push(object);
            return;
          }

          if (object._canBeSerialized()) {
            batch.push(object);
          } else {
            newRemaining.push(object);
          }
        });
        remaining = newRemaining;

        // If we can't save any objects, there must be a circular reference.
        if (batch.length === 0) {
          return AV.Promise.error(
            new AV.Error(AV.Error.OTHER_CAUSE,
                            "Tried to save a batch with a cycle."));
        }

        // Reserve a spot in every object's save queue.
        var readyToStart = AV.Promise.when(_.map(batch, function(object) {
          return object._allPreviousSaves || AV.Promise.as();
        }));
        var batchFinished = new AV.Promise();
        AV._arrayEach(batch, function(object) {
          object._allPreviousSaves = batchFinished;
        });

        // Save a single batch, whether previous saves succeeded or failed.
        return readyToStart._continueWith(function() {
          return AV._request("batch", null, null, "POST", {
            requests: _.map(batch, function(object) {
              var json = object._getSaveJSON();
              var method = "POST";

              var path = "/1.1/classes/" + object.className;
              if (object.id) {
                path = path + "/" + object.id;
                method = "PUT";
              }

              object._startSave();

              return {
                method: method,
                path: path,
                body: json
              };
            })

          }).then(function(response, status, xhr) {
            var error;
            AV._arrayEach(batch, function(object, i) {
              if (response[i].success) {
                object._finishSave(
                  object.parse(response[i].success, status, xhr));
              } else {
                error = error || response[i].error;
                object._cancelSave();
              }
            });
            if (error) {
              return AV.Promise.error(
                new AV.Error(error.code, error.error));
            }

          }).then(function(results) {
            batchFinished.resolve(results);
            return results;
          }, function(error) {
            batchFinished.reject(error);
            return AV.Promise.error(error);
          });
        });
      });
    }).then(function() {
      return object;
    });
  };

};

},{"underscore":28}],15:[function(require,module,exports){
'use strict';
var _ = require('underscore');

module.exports = function(AV) {

  /**
   * @class
   * A AV.Op is an atomic operation that can be applied to a field in a
   * AV.Object. For example, calling <code>object.set("foo", "bar")</code>
   * is an example of a AV.Op.Set. Calling <code>object.unset("foo")</code>
   * is a AV.Op.Unset. These operations are stored in a AV.Object and
   * sent to the server as part of <code>object.save()</code> operations.
   * Instances of AV.Op should be immutable.
   *
   * You should not create subclasses of AV.Op or instantiate AV.Op
   * directly.
   */
  AV.Op = function() {
    this._initialize.apply(this, arguments);
  };

  AV.Op.prototype = {
    _initialize: function() {}
  };

  _.extend(AV.Op, {
    /**
     * To create a new Op, call AV.Op._extend();
     */
    _extend: AV._extend,

    // A map of __op string to decoder function.
    _opDecoderMap: {},

    /**
     * Registers a function to convert a json object with an __op field into an
     * instance of a subclass of AV.Op.
     */
    _registerDecoder: function(opName, decoder) {
      AV.Op._opDecoderMap[opName] = decoder;
    },

    /**
     * Converts a json object into an instance of a subclass of AV.Op.
     */
    _decode: function(json) {
      var decoder = AV.Op._opDecoderMap[json.__op];
      if (decoder) {
        return decoder(json);
      } else {
        return undefined;
      }
    }
  });

  /*
   * Add a handler for Batch ops.
   */
  AV.Op._registerDecoder("Batch", function(json) {
    var op = null;
    AV._arrayEach(json.ops, function(nextOp) {
      nextOp = AV.Op._decode(nextOp);
      op = nextOp._mergeWithPrevious(op);
    });
    return op;
  });

  /**
   * @class
   * A Set operation indicates that either the field was changed using
   * AV.Object.set, or it is a mutable container that was detected as being
   * changed.
   */
  AV.Op.Set = AV.Op._extend(/** @lends AV.Op.Set.prototype */ {
    _initialize: function(value) {
      this._value = value;
    },

    /**
     * Returns the new value of this field after the set.
     */
    value: function() {
      return this._value;
    },

    /**
     * Returns a JSON version of the operation suitable for sending to AV.
     * @return {Object}
     */
    toJSON: function() {
      return AV._encode(this.value());
    },

    _mergeWithPrevious: function(previous) {
      return this;
    },

    _estimate: function(oldValue) {
      return this.value();
    }
  });

  /**
   * A sentinel value that is returned by AV.Op.Unset._estimate to
   * indicate the field should be deleted. Basically, if you find _UNSET as a
   * value in your object, you should remove that key.
   */
  AV.Op._UNSET = {};

  /**
   * @class
   * An Unset operation indicates that this field has been deleted from the
   * object.
   */
  AV.Op.Unset = AV.Op._extend(/** @lends AV.Op.Unset.prototype */ {
    /**
     * Returns a JSON version of the operation suitable for sending to AV.
     * @return {Object}
     */
    toJSON: function() {
      return { __op: "Delete" };
    },

    _mergeWithPrevious: function(previous) {
      return this;
    },

    _estimate: function(oldValue) {
      return AV.Op._UNSET;
    }
  });

  AV.Op._registerDecoder("Delete", function(json) {
    return new AV.Op.Unset();
  });

  /**
   * @class
   * An Increment is an atomic operation where the numeric value for the field
   * will be increased by a given amount.
   */
  AV.Op.Increment = AV.Op._extend(
      /** @lends AV.Op.Increment.prototype */ {

    _initialize: function(amount) {
      this._amount = amount;
    },

    /**
     * Returns the amount to increment by.
     * @return {Number} the amount to increment by.
     */
    amount: function() {
      return this._amount;
    },

    /**
     * Returns a JSON version of the operation suitable for sending to AV.
     * @return {Object}
     */
    toJSON: function() {
      return { __op: "Increment", amount: this._amount };
    },

    _mergeWithPrevious: function(previous) {
      if (!previous) {
        return this;
      } else if (previous instanceof AV.Op.Unset) {
        return new AV.Op.Set(this.amount());
      } else if (previous instanceof AV.Op.Set) {
        return new AV.Op.Set(previous.value() + this.amount());
      } else if (previous instanceof AV.Op.Increment) {
        return new AV.Op.Increment(this.amount() + previous.amount());
      } else {
        throw "Op is invalid after previous op.";
      }
    },

    _estimate: function(oldValue) {
      if (!oldValue) {
        return this.amount();
      }
      return oldValue + this.amount();
    }
  });

  AV.Op._registerDecoder("Increment", function(json) {
    return new AV.Op.Increment(json.amount);
  });

  /**
   * @class
   * Add is an atomic operation where the given objects will be appended to the
   * array that is stored in this field.
   */
  AV.Op.Add = AV.Op._extend(/** @lends AV.Op.Add.prototype */ {
    _initialize: function(objects) {
      this._objects = objects;
    },

    /**
     * Returns the objects to be added to the array.
     * @return {Array} The objects to be added to the array.
     */
    objects: function() {
      return this._objects;
    },

    /**
     * Returns a JSON version of the operation suitable for sending to AV.
     * @return {Object}
     */
    toJSON: function() {
      return { __op: "Add", objects: AV._encode(this.objects()) };
    },

    _mergeWithPrevious: function(previous) {
      if (!previous) {
        return this;
      } else if (previous instanceof AV.Op.Unset) {
        return new AV.Op.Set(this.objects());
      } else if (previous instanceof AV.Op.Set) {
        return new AV.Op.Set(this._estimate(previous.value()));
      } else if (previous instanceof AV.Op.Add) {
        return new AV.Op.Add(previous.objects().concat(this.objects()));
      } else {
        throw "Op is invalid after previous op.";
      }
    },

    _estimate: function(oldValue) {
      if (!oldValue) {
        return _.clone(this.objects());
      } else {
        return oldValue.concat(this.objects());
      }
    }
  });

  AV.Op._registerDecoder("Add", function(json) {
    return new AV.Op.Add(AV._decode(undefined, json.objects));
  });

  /**
   * @class
   * AddUnique is an atomic operation where the given items will be appended to
   * the array that is stored in this field only if they were not already
   * present in the array.
   */
  AV.Op.AddUnique = AV.Op._extend(
      /** @lends AV.Op.AddUnique.prototype */ {

    _initialize: function(objects) {
      this._objects = _.uniq(objects);
    },

    /**
     * Returns the objects to be added to the array.
     * @return {Array} The objects to be added to the array.
     */
    objects: function() {
      return this._objects;
    },

    /**
     * Returns a JSON version of the operation suitable for sending to AV.
     * @return {Object}
     */
    toJSON: function() {
      return { __op: "AddUnique", objects: AV._encode(this.objects()) };
    },

    _mergeWithPrevious: function(previous) {
      if (!previous) {
        return this;
      } else if (previous instanceof AV.Op.Unset) {
        return new AV.Op.Set(this.objects());
      } else if (previous instanceof AV.Op.Set) {
        return new AV.Op.Set(this._estimate(previous.value()));
      } else if (previous instanceof AV.Op.AddUnique) {
        return new AV.Op.AddUnique(this._estimate(previous.objects()));
      } else {
        throw "Op is invalid after previous op.";
      }
    },

    _estimate: function(oldValue) {
      if (!oldValue) {
        return _.clone(this.objects());
      } else {
        // We can't just take the _.uniq(_.union(...)) of oldValue and
        // this.objects, because the uniqueness may not apply to oldValue
        // (especially if the oldValue was set via .set())
        var newValue = _.clone(oldValue);
        AV._arrayEach(this.objects(), function(obj) {
          if (obj instanceof AV.Object && obj.id) {
            var matchingObj = _.find(newValue, function(anObj) {
              return (anObj instanceof AV.Object) && (anObj.id === obj.id);
            });
            if (!matchingObj) {
              newValue.push(obj);
            } else {
              var index = _.indexOf(newValue, matchingObj);
              newValue[index] = obj;
            }
          } else if (!_.contains(newValue, obj)) {
            newValue.push(obj);
          }
        });
        return newValue;
      }
    }
  });

  AV.Op._registerDecoder("AddUnique", function(json) {
    return new AV.Op.AddUnique(AV._decode(undefined, json.objects));
  });

  /**
   * @class
   * Remove is an atomic operation where the given objects will be removed from
   * the array that is stored in this field.
   */
  AV.Op.Remove = AV.Op._extend(/** @lends AV.Op.Remove.prototype */ {
    _initialize: function(objects) {
      this._objects = _.uniq(objects);
    },

    /**
     * Returns the objects to be removed from the array.
     * @return {Array} The objects to be removed from the array.
     */
    objects: function() {
      return this._objects;
    },

    /**
     * Returns a JSON version of the operation suitable for sending to AV.
     * @return {Object}
     */
    toJSON: function() {
      return { __op: "Remove", objects: AV._encode(this.objects()) };
    },

    _mergeWithPrevious: function(previous) {
      if (!previous) {
        return this;
      } else if (previous instanceof AV.Op.Unset) {
        return previous;
      } else if (previous instanceof AV.Op.Set) {
        return new AV.Op.Set(this._estimate(previous.value()));
      } else if (previous instanceof AV.Op.Remove) {
        return new AV.Op.Remove(_.union(previous.objects(), this.objects()));
      } else {
        throw "Op is invalid after previous op.";
      }
    },

    _estimate: function(oldValue) {
      if (!oldValue) {
        return [];
      } else {
        var newValue = _.difference(oldValue, this.objects());
        // If there are saved AV Objects being removed, also remove them.
        AV._arrayEach(this.objects(), function(obj) {
          if (obj instanceof AV.Object && obj.id) {
            newValue = _.reject(newValue, function(other) {
              return (other instanceof AV.Object) && (other.id === obj.id);
            });
          }
        });
        return newValue;
      }
    }
  });

  AV.Op._registerDecoder("Remove", function(json) {
    return new AV.Op.Remove(AV._decode(undefined, json.objects));
  });

  /**
   * @class
   * A Relation operation indicates that the field is an instance of
   * AV.Relation, and objects are being added to, or removed from, that
   * relation.
   */
  AV.Op.Relation = AV.Op._extend(
      /** @lends AV.Op.Relation.prototype */ {

    _initialize: function(adds, removes) {
      this._targetClassName = null;

      var self = this;

      var pointerToId = function(object) {
        if (object instanceof AV.Object) {
          if (!object.id) {
            throw "You can't add an unsaved AV.Object to a relation.";
          }
          if (!self._targetClassName) {
            self._targetClassName = object.className;
          }
          if (self._targetClassName !== object.className) {
            throw "Tried to create a AV.Relation with 2 different types: " +
                  self._targetClassName + " and " + object.className + ".";
          }
          return object.id;
        }
        return object;
      };

      this.relationsToAdd = _.uniq(_.map(adds, pointerToId));
      this.relationsToRemove = _.uniq(_.map(removes, pointerToId));
    },

    /**
     * Returns an array of unfetched AV.Object that are being added to the
     * relation.
     * @return {Array}
     */
    added: function() {
      var self = this;
      return _.map(this.relationsToAdd, function(objectId) {
        var object = AV.Object._create(self._targetClassName);
        object.id = objectId;
        return object;
      });
    },

    /**
     * Returns an array of unfetched AV.Object that are being removed from
     * the relation.
     * @return {Array}
     */
    removed: function() {
      var self = this;
      return _.map(this.relationsToRemove, function(objectId) {
        var object = AV.Object._create(self._targetClassName);
        object.id = objectId;
        return object;
      });
    },

    /**
     * Returns a JSON version of the operation suitable for sending to AV.
     * @return {Object}
     */
    toJSON: function() {
      var adds = null;
      var removes = null;
      var self = this;
      var idToPointer = function(id) {
        return { __type: 'Pointer',
                 className: self._targetClassName,
                 objectId: id };
      };
      var pointers = null;
      if (this.relationsToAdd.length > 0) {
        pointers = _.map(this.relationsToAdd, idToPointer);
        adds = { "__op": "AddRelation", "objects": pointers };
      }

      if (this.relationsToRemove.length > 0) {
        pointers = _.map(this.relationsToRemove, idToPointer);
        removes = { "__op": "RemoveRelation", "objects": pointers };
      }

      if (adds && removes) {
        return { "__op": "Batch", "ops": [adds, removes]};
      }

      return adds || removes || {};
    },

    _mergeWithPrevious: function(previous) {
      if (!previous) {
        return this;
      } else if (previous instanceof AV.Op.Unset) {
        throw "You can't modify a relation after deleting it.";
      } else if (previous instanceof AV.Op.Relation) {
        if (previous._targetClassName &&
            previous._targetClassName !== this._targetClassName) {
          throw "Related object must be of class " + previous._targetClassName +
              ", but " + this._targetClassName + " was passed in.";
        }
        var newAdd = _.union(_.difference(previous.relationsToAdd,
                                          this.relationsToRemove),
                             this.relationsToAdd);
        var newRemove = _.union(_.difference(previous.relationsToRemove,
                                             this.relationsToAdd),
                                this.relationsToRemove);

        var newRelation = new AV.Op.Relation(newAdd, newRemove);
        newRelation._targetClassName = this._targetClassName;
        return newRelation;
      } else {
        throw "Op is invalid after previous op.";
      }
    },

    _estimate: function(oldValue, object, key) {
      if (!oldValue) {
        var relation = new AV.Relation(object, key);
        relation.targetClassName = this._targetClassName;
      } else if (oldValue instanceof AV.Relation) {
        if (this._targetClassName) {
          if (oldValue.targetClassName) {
            if (oldValue.targetClassName !== this._targetClassName) {
              throw "Related object must be a " + oldValue.targetClassName +
                  ", but a " + this._targetClassName + " was passed in.";
            }
          } else {
            oldValue.targetClassName = this._targetClassName;
          }
        }
        return oldValue;
      } else {
        throw "Op is invalid after previous op.";
      }
    }
  });

  AV.Op._registerDecoder("AddRelation", function(json) {
    return new AV.Op.Relation(AV._decode(undefined, json.objects), []);
  });
  AV.Op._registerDecoder("RemoveRelation", function(json) {
    return new AV.Op.Relation([], AV._decode(undefined, json.objects));
  });

};

},{"underscore":28}],16:[function(require,module,exports){
(function (process){
'use strict';
var _ = require('underscore');

var Promise = module.exports = function Promise(fn) {
  /**
   * A Promise is returned by async methods as a hook to provide callbacks to be
   * called when the async task is fulfilled.
   *
   * <p>Typical usage would be like:<pre>
   *    query.find().then(function(results) {
   *      results[0].set("foo", "bar");
   *      return results[0].saveAsync();
   *    }).then(function(result) {
   *      console.log("Updated " + result.id);
   *    });
   * </pre></p>
   * <p>Another example:<pre>
   *    var promise = new AV.Promise(function(resolve, reject) {
   *      resolve(42);
   *    });
   *    promise.then(function(value){
   *      console.log(value);
   *    }).catch(function(error){
   *      console.error(error);
   *    });
   * </pre></p>
   * @param {Function} fn An optional function with two arguments resolve
   *                   and reject.The first argument fulfills the promise,
   *                   the second argument rejects it. We can call these
    *                  functions, once our operation is completed.
   * @see AV.Promise.prototype.then
   * @class
   */
    this._resolved = false;
    this._rejected = false;
    this._resolvedCallbacks = [];
    this._rejectedCallbacks = [];

    this.doResolve(fn);
};

var _isNullOrUndefined = function _isNullOrUndefined(x) {
  return _.isNull(x) || _.isUndefined(x);
};

var _isNode = false;

if (typeof(process) !== "undefined" &&
    process.versions &&
    process.versions.node) {
      _isNode = true;
}

_.extend(Promise, /** @lends AV.Promise */ {

  _isPromisesAPlusCompliant: !_isNode,
  _debugError: false,

  setPromisesAPlusCompliant: function(isCompliant) {
    Promise._isPromisesAPlusCompliant = isCompliant;
  },

  setDebugError: function(enable) {
    Promise._debugError = enable;
  },

  /**
   * Returns true iff the given object fulfils the Promise interface.
   * @return {Boolean}
   */
  is: function(promise) {
    return promise && promise.then && _.isFunction(promise.then);
  },

  /**
   * Returns a new promise that is resolved with a given value.
   * @return {AV.Promise} the new promise.
   */
  as: function() {
    var promise = new Promise();
    promise.resolve.apply(promise, arguments);
    return promise;
  },

  /**
   * Returns a new promise that is rejected with a given error.
   * @return {AV.Promise} the new promise.
   */
  error: function() {
    var promise = new Promise();
    promise.reject.apply(promise, arguments);
    return promise;
  },

  /**
   * Returns a new promise that is fulfilled when all of the input promises
   * are resolved. If any promise in the list fails, then the returned promise
   * will fail with the last error. If they all succeed, then the returned
   * promise will succeed, with the results being the results of all the input
   * promises. For example: <pre>
   *   var p1 = AV.Promise.as(1);
   *   var p2 = AV.Promise.as(2);
   *   var p3 = AV.Promise.as(3);
   *
   *   AV.Promise.when(p1, p2, p3).then(function(r1, r2, r3) {
   *     console.log(r1);  // prints 1
   *     console.log(r2);  // prints 2
   *     console.log(r3);  // prints 3
   *   });</pre>
   *
   * The input promises can also be specified as an array: <pre>
   *   var promises = [p1, p2, p3];
   *   AV.Promise.when(promises).then(function(r1, r2, r3) {
   *     console.log(r1);  // prints 1
   *     console.log(r2);  // prints 2
   *     console.log(r3);  // prints 3
   *   });
   * </pre>
   * @param {Array} promises a list of promises to wait for.
   * @return {AV.Promise} the new promise.
   */
  when: function(promises) {
    // Allow passing in Promises as separate arguments instead of an Array.
    var objects;
    if (promises && _isNullOrUndefined(promises.length)) {
      objects = arguments;
    } else {
      objects = promises;
    }
    var isAll = _.last(arguments);
    isAll = _.isBoolean(isAll) ? isAll : false;

    var total = objects.length;
    var hadError = false;
    var results = [];
    var errors = [];
    results.length = objects.length;
    errors.length = objects.length;

    if (total === 0) {
      if(isAll) {
        return Promise.as.call(this, results);
      } else {
        return Promise.as.apply(this, results);
      }
    }

    var promise = new Promise();

    var resolveOne = function(i) {
      total = total - 1;
      if(hadError && !promise._rejected && isAll) {
        promise.reject.call(promise, errors[i]);
        return;
      }

      if (total === 0) {
        if (hadError && !promise._rejected) {
          promise.reject.call(promise, errors);
        } else {
          if(isAll) {
            if(!promise._rejected) {
              promise.resolve.call(promise, results);
            } else {
              //It's rejected already, so we ignore it.
            }
          } else {
            promise.resolve.apply(promise, results);
          }
        }
      }
    };

    _.each(objects, function(object, i) {
      if (Promise.is(object)) {
        object.then(function(result) {
          results[i] = result;
          resolveOne(i);
        }, function(error) {
          errors[i] = error;
          hadError = true;
          resolveOne(i);
        });
      } else {
        results[i] = object;
        resolveOne(i);
      }
    });

    return promise;
  },

  /**
   * Returns a promise that resolves or rejects as soon as one
   * of the promises in the iterable resolves or rejects, with
   * the value or reason from that promise.Returns a new promise
   * that is fulfilled when one of the input promises.
   * For example: <pre>
   *   var p1 = AV.Promise.as(1);
   *   var p2 = AV.Promise.as(2);
   *   var p3 = AV.Promise.as(3);
   *
   *   AV.Promise.race(p1, p2, p3).then(function(result) {
   *     console.log(result);  // prints 1
   *   });</pre>
   *
   * The input promises can also be specified as an array: <pre>
   *   var promises = [p1, p2, p3];
   *   AV.Promise.when(promises).then(function(result) {
   *     console.log(result);  // prints 1
   *   });
   * </pre>
   * @param {Array} promises a list of promises to wait for.
   * @return {AV.Promise} the new promise.
   */
  race: function(promises) {
    // Allow passing in Promises as separate arguments instead of an Array.
    var objects;
    if (promises && _isNullOrUndefined(promises.length)) {
      objects = arguments;
    } else {
      objects = promises;
    }

    var total = objects.length;
    var hadError = false;
    var results = [];
    var errors = [];

    results.length = errors.length = objects.length;

    if (total === 0) {
      return Promise.as.call(this);
    }

    var promise = new Promise();

    var resolveOne = function(i) {
      if (!promise._resolved && !promise._rejected) {
        if (hadError) {
          promise.reject.call(promise, errors[i]);
        } else {
          promise.resolve.call(promise, results[i]);
        }
      }
    };

    _.each(objects, function(object, i) {
      if (Promise.is(object)) {
        object.then(function(result) {
          results[i] = result;
          resolveOne(i);
        }, function(error) {
          errors[i] = error;
          hadError = true;
          resolveOne(i);
        });
      } else {
        results[i] = object;
        resolveOne(i);
      }
    });

    return promise;
  },

  /**
   * Runs the given asyncFunction repeatedly, as long as the predicate
   * function returns a truthy value. Stops repeating if asyncFunction returns
   * a rejected promise.
   * @param {Function} predicate should return false when ready to stop.
   * @param {Function} asyncFunction should return a Promise.
   */
  _continueWhile: function(predicate, asyncFunction) {
    if (predicate()) {
      return asyncFunction().then(function() {
        return Promise._continueWhile(predicate, asyncFunction);
      });
    }
    return Promise.as();
  }
});

/**
 * Just like AV.Promise.when, but it calls resolveCallbck function
 * with one results array and calls rejectCallback function as soon as any one
 * of the input promises rejects.
 * @see AV.Promise.when
 */
Promise.all = function(promises) {
  return Promise.when(promises, true);
};

_.extend(Promise.prototype, /** @lends AV.Promise.prototype */ {

  /**
   * Marks this promise as fulfilled, firing any callbacks waiting on it.
   * @param {Object} result the result to pass to the callbacks.
   */
  resolve: function(result) {
    if (this._resolved || this._rejected) {
      throw "A promise was resolved even though it had already been " +
        (this._resolved ? "resolved" : "rejected") + ".";
    }
    this._resolved = true;
    this._result = arguments;
    var results = arguments;
    _.each(this._resolvedCallbacks, function(resolvedCallback) {
      resolvedCallback.apply(this, results);
    });
    this._resolvedCallbacks = [];
    this._rejectedCallbacks = [];
  },

  doResolve: function(fn){
    if (!fn) return;
    var done = false;
    var self = this;
    try {
      fn(function (value) {
        if (done) return;
        done = true;
        self.resolve.call(self, value);
      }, function (reason) {
           if (done) return;
           done = true;
           self.reject.call(self, reason);
      });
    } catch (ex) {
      if (done) return;
      done = true;
      self.reject.call(self, ex);
    }
  },

  /**
   * Marks this promise as fulfilled, firing any callbacks waiting on it.
   * @param {Object} error the error to pass to the callbacks.
   */
  reject: function(error) {
    if (this._resolved || this._rejected) {
      throw "A promise was rejected even though it had already been " +
        (this._resolved ? "resolved" : "rejected") + ".";
    }
    this._rejected = true;
    this._error = error;
    _.each(this._rejectedCallbacks, function(rejectedCallback) {
      rejectedCallback(error);
    });
    this._resolvedCallbacks = [];
    this._rejectedCallbacks = [];
  },

  /**
   * Adds callbacks to be called when this promise is fulfilled. Returns a new
   * Promise that will be fulfilled when the callback is complete. It allows
   * chaining. If the callback itself returns a Promise, then the one returned
   * by "then" will not be fulfilled until that one returned by the callback
   * is fulfilled.
   * @param {Function} resolvedCallback Function that is called when this
   * Promise is resolved. Once the callback is complete, then the Promise
   * returned by "then" will also be fulfilled.
   * @param {Function} rejectedCallback Function that is called when this
   * Promise is rejected with an error. Once the callback is complete, then
   * the promise returned by "then" with be resolved successfully. If
   * rejectedCallback is null, or it returns a rejected Promise, then the
   * Promise returned by "then" will be rejected with that error.
   * @return {AV.Promise} A new Promise that will be fulfilled after this
   * Promise is fulfilled and either callback has completed. If the callback
   * returned a Promise, then this Promise will not be fulfilled until that
   * one is.
   */
  then: function(resolvedCallback, rejectedCallback) {
    var promise = new Promise();

    var wrappedResolvedCallback = function() {
      var result = arguments;
      if (resolvedCallback) {
        if (Promise._isPromisesAPlusCompliant) {
          try {
            result = [resolvedCallback.apply(this, result)];
          } catch (e) {
            if(Promise._debugError && e) {
              console.error('Error occurred in promise resolve callback.', e.stack || e);
            }
            result = [Promise.error(e)];
          }
        } else {
          result = [resolvedCallback.apply(this, result)];
        }
      }
      if (result.length === 1 && Promise.is(result[0])) {
        result[0].then(function() {
          promise.resolve.apply(promise, arguments);
        }, function(error) {
          promise.reject(error);
        });
      } else {
        promise.resolve.apply(promise, result);
      }
    };

    var wrappedRejectedCallback = function(error) {
      var result = [];
      if (rejectedCallback) {
        if (Promise._isPromisesAPlusCompliant) {
          try {
            result = [rejectedCallback(error)];
          } catch (e) {
            if(Promise._debugError && e) {
              console.error('Error occurred in promise reject callback.', e.stack || e);
            }
            result = [Promise.error(e)];
          }
        } else {
          result = [rejectedCallback(error)];
        }
        if (result.length === 1 && Promise.is(result[0])) {
          result[0].then(function() {
            promise.resolve.apply(promise, arguments);
          }, function(error) {
            promise.reject(error);
          });
        } else {
          if (Promise._isPromisesAPlusCompliant) {
            promise.resolve.apply(promise, result);
          } else {
            promise.reject(result[0]);
          }
        }
      } else {
        promise.reject(error);
      }
    };

    var runLater = function(func) {
      func.call();
    };
    if (Promise._isPromisesAPlusCompliant) {
      if (typeof(window) !== 'undefined' && _.isFunction(window.setImmediate)) {
        runLater = function(func) {
          window.setImmediate(func);
        };
      } else if (typeof(process) !== 'undefined' && process.nextTick) {
        runLater = function(func) {
           process.nextTick(func);
        };
      } else if (typeof(setTimeout) !== 'undefined' && _.isFunction(setTimeout)) {
        runLater = function(func) {
          setTimeout(func, 0);
        };
      }
    }

    var self = this;
    if (this._resolved) {
      runLater(function() {
        wrappedResolvedCallback.apply(self, self._result);
      });
    } else if (this._rejected) {
      runLater(function() {
        wrappedRejectedCallback.apply(self, [self._error]);
      });
    } else {
      this._resolvedCallbacks.push(wrappedResolvedCallback);
      this._rejectedCallbacks.push(wrappedRejectedCallback);
    }

    return promise;
  },

  /**
   * Add handlers to be called when the Promise object is rejected.
   *
   * @param {Function} rejectedCallback Function that is called when this
   *                   Promise is rejected with an error.
   * @return {AV.Promise} A new Promise that will be fulfilled after this
   *                   Promise is fulfilled and either callback has completed. If the callback
   * returned a Promise, then this Promise will not be fulfilled until that
   *                   one is.
   * @function
   */
  catch: function(onRejected) {
    return this.then(undefined, onRejected);
  },

  /**
   * Add handlers to be called when the promise
   * is either resolved or rejected
   */
  always: function(callback) {
    return this.then(callback, callback);
  },

  /**
   * Add handlers to be called when the Promise object is resolved
   */
  done: function(callback) {
    return this.then(callback);
  },

  /**
   * Add handlers to be called when the Promise object is rejected
   */
  fail: function(callback) {
    return this.then(null, callback);
  },

  /**
   * Run the given callbacks after this promise is fulfilled.
   * @param optionsOrCallback {} A Backbone-style options callback, or a
   * callback function. If this is an options object and contains a "model"
   * attributes, that will be passed to error callbacks as the first argument.
   * @param model {} If truthy, this will be passed as the first result of
   * error callbacks. This is for Backbone-compatability.
   * @return {AV.Promise} A promise that will be resolved after the
   * callbacks are run, with the same result as this.
   */
  _thenRunCallbacks: function(optionsOrCallback, model) {
    var options;
    if (_.isFunction(optionsOrCallback)) {
      var callback = optionsOrCallback;
      options = {
        success: function(result) {
          callback(result, null);
        },
        error: function(error) {
          callback(null, error);
        }
      };
    } else {
      options = _.clone(optionsOrCallback);
    }
    options = options || {};

    return this.then(function(result) {
      if (options.success) {
        options.success.apply(this, arguments);
      } else if (model) {
        // When there's no callback, a sync event should be triggered.
        model.trigger('sync', model, result, options);
      }
      return Promise.as.apply(Promise, arguments);
    }, function(error) {
      if (options.error) {
        if (!_.isUndefined(model)) {
          options.error(model, error);
        } else {
          options.error(error);
        }
      } else if (model) {
        // When there's no error callback, an error event should be triggered.
        model.trigger('error', model, error, options);
      }
      // By explicitly returning a rejected Promise, this will work with
      // either jQuery or Promises/A semantics.
      return Promise.error(error);
    });
  },

  /**
   * Adds a callback function that should be called regardless of whether
   * this promise failed or succeeded. The callback will be given either the
   * array of results for its first argument, or the error as its second,
   * depending on whether this Promise was rejected or resolved. Returns a
   * new Promise, like "then" would.
   * @param {Function} continuation the callback.
   */
  _continueWith: function(continuation) {
    return this.then(function() {
      return continuation(arguments, null);
    }, function(error) {
      return continuation(null, error);
    });
  }

});

/**
 * Alias of AV.Promise.prototype.always
 * @function
 * @see AV.Promise#always
 */
Promise.prototype.finally = Promise.prototype.always;

/**
 * Alias of AV.Promise.prototype.done
 * @function
 * @see AV.Promise#done
 */
Promise.prototype.try = Promise.prototype.done;

}).call(this,require('_process'))
},{"_process":27,"underscore":28}],17:[function(require,module,exports){
'use strict';

module.exports = function(AV) {
  AV.Installation = AV.Object.extend("_Installation");

  /**
   * Contains functions to deal with Push in AV
   * @name AV.Push
   * @namespace
   */
  AV.Push = AV.Push || {};

  /**
   * Sends a push notification.
   * @param {Object} data -  The data of the push notification.  Valid fields
   * are:
   *   <ol>
   *     <li>channels - An Array of channels to push to.</li>
   *     <li>push_time - A Date object for when to send the push.</li>
   *     <li>expiration_time -  A Date object for when to expire
   *         the push.</li>
   *     <li>expiration_interval - The seconds from now to expire the push.</li>
   *     <li>where - A AV.Query over AV.Installation that is used to match
   *         a set of installations to push to.</li>
   *     <li>cql - A CQL statement over AV.Installation that is used to match
   *         a set of installations to push to.</li>
   *     <li>data - The data to send as part of the push</li>
   *   <ol>
   * @param {Object} options An object that has an optional success function,
   * that takes no arguments and will be called on a successful push, and
   * an error function that takes a AV.Error and will be called if the push
   * failed.
   */
  AV.Push.send = function(data, options) {
    if (data.where) {
      data.where = data.where.toJSON().where;
    }

    if(data.where && data.cql){
      throw "Both where and cql can't be set";
    }

    if (data.push_time) {
      data.push_time = data.push_time.toJSON();
    }

    if (data.expiration_time) {
      data.expiration_time = data.expiration_time.toJSON();
    }

    if (data.expiration_time && data.expiration_time_interval) {
      throw "Both expiration_time and expiration_time_interval can't be set";
    }

    var request = AV._request('push', null, null, 'POST', data);
    return request._thenRunCallbacks(options);
  };
};

},{}],18:[function(require,module,exports){
'use strict';

var _ = require('underscore');

// AV.Query is a way to create a list of AV.Objects.
module.exports = function(AV) {
  /**
   * Creates a new avoscloud AV.Query for the given AV.Object subclass.
   * @param objectClass -
   *   An instance of a subclass of AV.Object, or a AV className string.
   * @class
   *
   * <p>AV.Query defines a query that is used to fetch AV.Objects. The
   * most common use case is finding all objects that match a query through the
   * <code>find</code> method. For example, this sample code fetches all objects
   * of class <code>MyClass</code>. It calls a different function depending on
   * whether the fetch succeeded or not.
   *
   * <pre>
   * var query = new AV.Query(MyClass);
   * query.find({
   *   success: function(results) {
   *     // results is an array of AV.Object.
   *   },
   *
   *   error: function(error) {
   *     // error is an instance of AV.Error.
   *   }
   * });</pre></p>
   *
   * <p>A AV.Query can also be used to retrieve a single object whose id is
   * known, through the get method. For example, this sample code fetches an
   * object of class <code>MyClass</code> and id <code>myId</code>. It calls a
   * different function depending on whether the fetch succeeded or not.
   *
   * <pre>
   * var query = new AV.Query(MyClass);
   * query.get(myId, {
   *   success: function(object) {
   *     // object is an instance of AV.Object.
   *   },
   *
   *   error: function(object, error) {
   *     // error is an instance of AV.Error.
   *   }
   * });</pre></p>
   *
   * <p>A AV.Query can also be used to count the number of objects that match
   * the query without retrieving all of those objects. For example, this
   * sample code counts the number of objects of the class <code>MyClass</code>
   * <pre>
   * var query = new AV.Query(MyClass);
   * query.count({
   *   success: function(number) {
   *     // There are number instances of MyClass.
   *   },
   *
   *   error: function(error) {
   *     // error is an instance of AV.Error.
   *   }
   * });</pre></p>
   */
  AV.Query = function(objectClass) {
    if (_.isString(objectClass)) {
      objectClass = AV.Object._getSubclass(objectClass);
    }

    this.objectClass = objectClass;

    this.className = objectClass.prototype.className;

    this._where = {};
    this._include = [];
    this._limit = -1; // negative limit means, do not send a limit
    this._skip = 0;
    this._extraOptions = {};
  };

  /**
   * Constructs a AV.Query that is the OR of the passed in queries.  For
   * example:
   * <pre>var compoundQuery = AV.Query.or(query1, query2, query3);</pre>
   *
   * will create a compoundQuery that is an or of the query1, query2, and
   * query3.
   * @param {...AV.Query} var_args The list of queries to OR.
   * @return {AV.Query} The query that is the OR of the passed in queries.
   */
  AV.Query.or = function() {
    var queries = _.toArray(arguments);
    var className = null;
    AV._arrayEach(queries, function(q) {
      if (_.isNull(className)) {
        className = q.className;
      }

      if (className !== q.className) {
        throw "All queries must be for the same class";
      }
    });
    var query = new AV.Query(className);
    query._orQuery(queries);
    return query;
  };

  /**
   * Constructs a AV.Query that is the AND of the passed in queries.  For
   * example:
   * <pre>var compoundQuery = AV.Query.and(query1, query2, query3);</pre>
   *
   * will create a compoundQuery that is an 'and' of the query1, query2, and
   * query3.
   * @param {...AV.Query} var_args The list of queries to AND.
   * @return {AV.Query} The query that is the AND of the passed in queries.
   */
  AV.Query.and = function() {
    var queries = _.toArray(arguments);
    var className = null;
    AV._arrayEach(queries, function(q) {
      if (_.isNull(className)) {
        className = q.className;
      }

      if (className !== q.className) {
        throw "All queries must be for the same class";
      }
    });
    var query = new AV.Query(className);
    query._andQuery(queries);
    return query;
  };

  /**
   * Retrieves a list of AVObjects that satisfy the CQL.
   * CQL syntax please see <a href='https://cn.avoscloud.com/docs/cql_guide.html'>CQL Guide.</a>
   * Either options.success or options.error is called when the find
   * completes.
   *
   * @param {String} cql,  A CQL string, see <a href='https://cn.avoscloud.com/docs/cql_guide.html'>CQL Guide.</a>
   * @param {Array} pvalues, An array contains placeholder values.
   * @param {Object} options A Backbone-style options object,it's optional.
   * @return {AV.Promise} A promise that is resolved with the results when
   * the query completes,it's optional.
   */
  AV.Query.doCloudQuery = function(cql, pvalues, options) {
    var params = { cql: cql };
    if(_.isArray(pvalues)){
      params.pvalues = pvalues;
    } else {
      options = pvalues;
    }

    var request = AV._request("cloudQuery", null, null, 'GET', params);
    return request.then(function(response) {
      //query to process results.
      var query = new AV.Query(response.className);
      var results = _.map(response.results, function(json) {
        var obj = query._newObject(response);
        obj._finishFetch(query._processResult(json), true);
          return obj;
      });
      return {
        results: results,
        count:  response.count,
        className: response.className
      };
    })._thenRunCallbacks(options);
  };

  AV.Query._extend = AV._extend;

  AV.Query.prototype = {
     //hook to iterate result. Added by dennis<xzhuang@avoscloud.com>.
     _processResult: function(obj){
        return obj;
    },

    /**
     * Constructs a AV.Object whose id is already known by fetching data from
     * the server.  Either options.success or options.error is called when the
     * find completes.
     *
     * @param {} objectId The id of the object to be fetched.
     * @param {Object} options A Backbone-style options object.
     */
    get: function(objectId, options) {
      if(!objectId) {
        var errorObject = new AV.Error(AV.Error.OBJECT_NOT_FOUND,
                                          "Object not found.");
        return AV.Promise.error(errorObject);
      }

      var self = this;
      self.equalTo('objectId', objectId);

      return self.first().then(function(response) {
        if (!AV._.isEmpty(response)) {
          return response;
        }

        var errorObject = new AV.Error(AV.Error.OBJECT_NOT_FOUND,
                                          "Object not found.");
        return AV.Promise.error(errorObject);

      })._thenRunCallbacks(options, null);
    },

    /**
     * Returns a JSON representation of this query.
     * @return {Object}
     */
    toJSON: function() {
      var params = {
        where: this._where
      };

      if (this._include.length > 0) {
        params.include = this._include.join(",");
      }
      if (this._select) {
        params.keys = this._select.join(",");
      }
      if (this._limit >= 0) {
        params.limit = this._limit;
      }
      if (this._skip > 0) {
        params.skip = this._skip;
      }
      if (this._order !== undefined) {
        params.order = this._order;
      }

      AV._objectEach(this._extraOptions, function(v, k) {
        params[k] = v;
      });

      return params;
    },

    _newObject: function(response){
      var obj;
      if (response && response.className) {
        obj = new AV.Object(response.className);
      } else {
        obj = new this.objectClass();
      }
      return obj;
    },
    _createRequest: function(params){
      return AV._request("classes", this.className, null, "GET",
                                   params || this.toJSON());
    },

    /**
     * Retrieves a list of AVObjects that satisfy this query.
     * Either options.success or options.error is called when the find
     * completes.
     *
     * @param {Object} options A Backbone-style options object.
     * @return {AV.Promise} A promise that is resolved with the results when
     * the query completes.
     */
    find: function(options) {
      var self = this;

      var request = this._createRequest();

      return request.then(function(response) {
        return _.map(response.results, function(json) {
          var obj = self._newObject(response);
          obj._finishFetch(self._processResult(json), true);
          return obj;
        });
      })._thenRunCallbacks(options);
    },

   /**
    * Delete objects retrieved by this query.
    * @param {Object} options Standard options object with success and error
    *     callbacks.
    * @return {AV.Promise} A promise that is fulfilled when the save
    *     completes.
    */
     destroyAll: function(options){
       var self = this;
       return self.find().then(function(objects){
           return AV.Object.destroyAll(objects);
       })._thenRunCallbacks(options);
     },

    /**
     * Counts the number of objects that match this query.
     * Either options.success or options.error is called when the count
     * completes.
     *
     * @param {Object} options A Backbone-style options object.
     * @return {AV.Promise} A promise that is resolved with the count when
     * the query completes.
     */
    count: function(options) {
      var params = this.toJSON();
      params.limit = 0;
      params.count = 1;
      var request = this._createRequest(params);

      return request.then(function(response) {
        return response.count;
      })._thenRunCallbacks(options);
    },

    /**
     * Retrieves at most one AV.Object that satisfies this query.
     *
     * Either options.success or options.error is called when it completes.
     * success is passed the object if there is one. otherwise, undefined.
     *
     * @param {Object} options A Backbone-style options object.
     * @return {AV.Promise} A promise that is resolved with the object when
     * the query completes.
     */
    first: function(options) {
      var self = this;

      var params = this.toJSON();
      params.limit = 1;
      var request = this._createRequest(params);

      return request.then(function(response) {
        return _.map(response.results, function(json) {
          var obj = self._newObject();
          obj._finishFetch(self._processResult(json), true);
          return obj;
        })[0];
      })._thenRunCallbacks(options);
    },

    /**
     * Returns a new instance of AV.Collection backed by this query.
     * @return {AV.Collection}
     */
    collection: function(items, options) {
      options = options || {};
      return new AV.Collection(items, _.extend(options, {
        model: this._objectClass || this.objectClass,
        query: this
      }));
    },

    /**
     * Sets the number of results to skip before returning any results.
     * This is useful for pagination.
     * Default is to skip zero results.
     * @param {Number} n the number of results to skip.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    skip: function(n) {
      this._skip = n;
      return this;
    },

    /**
     * Sets the limit of the number of results to return. The default limit is
     * 100, with a maximum of 1000 results being returned at a time.
     * @param {Number} n the number of results to limit to.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    limit: function(n) {
      this._limit = n;
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * be equal to the provided value.
     * @param {String} key The key to check.
     * @param value The value that the AV.Object must contain.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    equalTo: function(key, value) {
      this._where[key] = AV._encode(value);
      return this;
    },

    /**
     * Helper for condition queries
     */
    _addCondition: function(key, condition, value) {
      // Check if we already have a condition
      if (!this._where[key]) {
        this._where[key] = {};
      }
      this._where[key][condition] = AV._encode(value);
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular
     * <strong>array</strong> key's length to be equal to the provided value.
     * @param {String} key The array key to check.
     * @param value The length value.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    sizeEqualTo: function(key, value) {
      this._addCondition(key, "$size", value);
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * be not equal to the provided value.
     * @param {String} key The key to check.
     * @param value The value that must not be equalled.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    notEqualTo: function(key, value) {
      this._addCondition(key, "$ne", value);
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * be less than the provided value.
     * @param {String} key The key to check.
     * @param value The value that provides an upper bound.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    lessThan: function(key, value) {
      this._addCondition(key, "$lt", value);
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * be greater than the provided value.
     * @param {String} key The key to check.
     * @param value The value that provides an lower bound.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    greaterThan: function(key, value) {
      this._addCondition(key, "$gt", value);
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * be less than or equal to the provided value.
     * @param {String} key The key to check.
     * @param value The value that provides an upper bound.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    lessThanOrEqualTo: function(key, value) {
      this._addCondition(key, "$lte", value);
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * be greater than or equal to the provided value.
     * @param {String} key The key to check.
     * @param value The value that provides an lower bound.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    greaterThanOrEqualTo: function(key, value) {
      this._addCondition(key, "$gte", value);
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * be contained in the provided list of values.
     * @param {String} key The key to check.
     * @param {Array} values The values that will match.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    containedIn: function(key, values) {
      this._addCondition(key, "$in", values);
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * not be contained in the provided list of values.
     * @param {String} key The key to check.
     * @param {Array} values The values that will not match.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    notContainedIn: function(key, values) {
      this._addCondition(key, "$nin", values);
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * contain each one of the provided list of values.
     * @param {String} key The key to check.  This key's value must be an array.
     * @param {Array} values The values that will match.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    containsAll: function(key, values) {
      this._addCondition(key, "$all", values);
      return this;
    },


    /**
     * Add a constraint for finding objects that contain the given key.
     * @param {String} key The key that should exist.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    exists: function(key) {
      this._addCondition(key, "$exists", true);
      return this;
    },

    /**
     * Add a constraint for finding objects that do not contain a given key.
     * @param {String} key The key that should not exist
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    doesNotExist: function(key) {
      this._addCondition(key, "$exists", false);
      return this;
    },

    /**
     * Add a regular expression constraint for finding string values that match
     * the provided regular expression.
     * This may be slow for large datasets.
     * @param {String} key The key that the string to match is stored in.
     * @param {RegExp} regex The regular expression pattern to match.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    matches: function(key, regex, modifiers) {
      this._addCondition(key, "$regex", regex);
      if (!modifiers) { modifiers = ""; }
      // Javascript regex options support mig as inline options but store them
      // as properties of the object. We support mi & should migrate them to
      // modifiers
      if (regex.ignoreCase) { modifiers += 'i'; }
      if (regex.multiline) { modifiers += 'm'; }

      if (modifiers && modifiers.length) {
        this._addCondition(key, "$options", modifiers);
      }
      return this;
    },

    /**
     * Add a constraint that requires that a key's value matches a AV.Query
     * constraint.
     * @param {String} key The key that the contains the object to match the
     *                     query.
     * @param {AV.Query} query The query that should match.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    matchesQuery: function(key, query) {
      var queryJSON = query.toJSON();
      queryJSON.className = query.className;
      this._addCondition(key, "$inQuery", queryJSON);
      return this;
    },

   /**
     * Add a constraint that requires that a key's value not matches a
     * AV.Query constraint.
     * @param {String} key The key that the contains the object to match the
     *                     query.
     * @param {AV.Query} query The query that should not match.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    doesNotMatchQuery: function(key, query) {
      var queryJSON = query.toJSON();
      queryJSON.className = query.className;
      this._addCondition(key, "$notInQuery", queryJSON);
      return this;
    },


    /**
     * Add a constraint that requires that a key's value matches a value in
     * an object returned by a different AV.Query.
     * @param {String} key The key that contains the value that is being
     *                     matched.
     * @param {String} queryKey The key in the objects returned by the query to
     *                          match against.
     * @param {AV.Query} query The query to run.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    matchesKeyInQuery: function(key, queryKey, query) {
      var queryJSON = query.toJSON();
      queryJSON.className = query.className;
      this._addCondition(key, "$select",
                         { key: queryKey, query: queryJSON });
      return this;
    },

    /**
     * Add a constraint that requires that a key's value not match a value in
     * an object returned by a different AV.Query.
     * @param {String} key The key that contains the value that is being
     *                     excluded.
     * @param {String} queryKey The key in the objects returned by the query to
     *                          match against.
     * @param {AV.Query} query The query to run.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    doesNotMatchKeyInQuery: function(key, queryKey, query) {
      var queryJSON = query.toJSON();
      queryJSON.className = query.className;
      this._addCondition(key, "$dontSelect",
                         { key: queryKey, query: queryJSON });
      return this;
    },

    /**
     * Add constraint that at least one of the passed in queries matches.
     * @param {Array} queries
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    _orQuery: function(queries) {
      var queryJSON = _.map(queries, function(q) {
        return q.toJSON().where;
      });

      this._where.$or = queryJSON;
      return this;
    },

    /**
     * Add constraint that both of the passed in queries matches.
     * @param {Array} queries
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    _andQuery: function(queries) {
      var queryJSON = _.map(queries, function(q) {
        return q.toJSON().where;
      });

      this._where.$and = queryJSON;
      return this;
    },


    /**
     * Converts a string into a regex that matches it.
     * Surrounding with \Q .. \E does this, we just need to escape \E's in
     * the text separately.
     */
    _quote: function(s) {
      return "\\Q" + s.replace("\\E", "\\E\\\\E\\Q") + "\\E";
    },

    /**
     * Add a constraint for finding string values that contain a provided
     * string.  This may be slow for large datasets.
     * @param {String} key The key that the string to match is stored in.
     * @param {String} substring The substring that the value must contain.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    contains: function(key, value) {
      this._addCondition(key, "$regex", this._quote(value));
      return this;
    },

    /**
     * Add a constraint for finding string values that start with a provided
     * string.  This query will use the backend index, so it will be fast even
     * for large datasets.
     * @param {String} key The key that the string to match is stored in.
     * @param {String} prefix The substring that the value must start with.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    startsWith: function(key, value) {
      this._addCondition(key, "$regex", "^" + this._quote(value));
      return this;
    },

    /**
     * Add a constraint for finding string values that end with a provided
     * string.  This will be slow for large datasets.
     * @param {String} key The key that the string to match is stored in.
     * @param {String} suffix The substring that the value must end with.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    endsWith: function(key, value) {
      this._addCondition(key, "$regex", this._quote(value) + "$");
      return this;
    },

    /**
     * Sorts the results in ascending order by the given key.
     *
     * @param {String} key The key to order by.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    ascending: function(key) {
      this._order = key;
      return this;
    },

  /**
   * Also sorts the results in ascending order by the given key. The previous sort keys have
   * precedence over this key.
   *
   * @param {String} key The key to order by
   * @return {AV.Query} Returns the query so you can chain this call.
   */
   addAscending: function(key){
     if(this._order)
       this._order +=  ','  + key;
    else
       this._order = key;
    return this;
   },

    /**
     * Sorts the results in descending order by the given key.
     *
     * @param {String} key The key to order by.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    descending: function(key) {
      this._order = "-" + key;
      return this;
    },

     /**
   * Also sorts the results in descending order by the given key. The previous sort keys have
   * precedence over this key.
   *
   * @param {String} key The key to order by
   * @return {AV.Query} Returns the query so you can chain this call.
   */
   addDescending: function(key){
     if(this._order)
       this._order += ',-' + key;
     else
       this._order = '-' + key;
     return key;
   },

    /**
     * Add a proximity based constraint for finding objects with key point
     * values near the point given.
     * @param {String} key The key that the AV.GeoPoint is stored in.
     * @param {AV.GeoPoint} point The reference AV.GeoPoint that is used.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    near: function(key, point) {
      if (!(point instanceof AV.GeoPoint)) {
        // Try to cast it to a GeoPoint, so that near("loc", [20,30]) works.
        point = new AV.GeoPoint(point);
      }
      this._addCondition(key, "$nearSphere", point);
      return this;
    },

    /**
     * Add a proximity based constraint for finding objects with key point
     * values near the point given and within the maximum distance given.
     * @param {String} key The key that the AV.GeoPoint is stored in.
     * @param {AV.GeoPoint} point The reference AV.GeoPoint that is used.
     * @param maxDistance Maximum distance (in radians) of results to return.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    withinRadians: function(key, point, distance) {
      this.near(key, point);
      this._addCondition(key, "$maxDistance", distance);
      return this;
    },

    /**
     * Add a proximity based constraint for finding objects with key point
     * values near the point given and within the maximum distance given.
     * Radius of earth used is 3958.8 miles.
     * @param {String} key The key that the AV.GeoPoint is stored in.
     * @param {AV.GeoPoint} point The reference AV.GeoPoint that is used.
     * @param {Number} maxDistance Maximum distance (in miles) of results to
     *     return.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    withinMiles: function(key, point, distance) {
      return this.withinRadians(key, point, distance / 3958.8);
    },

    /**
     * Add a proximity based constraint for finding objects with key point
     * values near the point given and within the maximum distance given.
     * Radius of earth used is 6371.0 kilometers.
     * @param {String} key The key that the AV.GeoPoint is stored in.
     * @param {AV.GeoPoint} point The reference AV.GeoPoint that is used.
     * @param {Number} maxDistance Maximum distance (in kilometers) of results
     *     to return.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    withinKilometers: function(key, point, distance) {
      return this.withinRadians(key, point, distance / 6371.0);
    },

    /**
     * Add a constraint to the query that requires a particular key's
     * coordinates be contained within a given rectangular geographic bounding
     * box.
     * @param {String} key The key to be constrained.
     * @param {AV.GeoPoint} southwest
     *     The lower-left inclusive corner of the box.
     * @param {AV.GeoPoint} northeast
     *     The upper-right inclusive corner of the box.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    withinGeoBox: function(key, southwest, northeast) {
      if (!(southwest instanceof AV.GeoPoint)) {
        southwest = new AV.GeoPoint(southwest);
      }
      if (!(northeast instanceof AV.GeoPoint)) {
        northeast = new AV.GeoPoint(northeast);
      }
      this._addCondition(key, '$within', { '$box': [southwest, northeast] });
      return this;
    },

    /**
     * Include nested AV.Objects for the provided key.  You can use dot
     * notation to specify which fields in the included object are also fetch.
     * @param {String} key The name of the key to include.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    include: function() {
      var self = this;
      AV._arrayEach(arguments, function(key) {
        if (_.isArray(key)) {
          self._include = self._include.concat(key);
        } else {
          self._include.push(key);
        }
      });
      return this;
    },

    /**
     * Restrict the fields of the returned AV.Objects to include only the
     * provided keys.  If this is called multiple times, then all of the keys
     * specified in each of the calls will be included.
     * @param {Array} keys The names of the keys to include.
     * @return {AV.Query} Returns the query, so you can chain this call.
     */
    select: function() {
      var self = this;
      this._select = this._select || [];
      AV._arrayEach(arguments, function(key) {
        if (_.isArray(key)) {
          self._select = self._select.concat(key);
        } else {
          self._select.push(key);
        }
      });
      return this;
    },

    /**
     * Iterates over each result of a query, calling a callback for each one. If
     * the callback returns a promise, the iteration will not continue until
     * that promise has been fulfilled. If the callback returns a rejected
     * promise, then iteration will stop with that error. The items are
     * processed in an unspecified order. The query may not have any sort order,
     * and may not use limit or skip.
     * @param callback {Function} Callback that will be called with each result
     *     of the query.
     * @param options {Object} An optional Backbone-like options object with
     *     success and error callbacks that will be invoked once the iteration
     *     has finished.
     * @return {AV.Promise} A promise that will be fulfilled once the
     *     iteration has completed.
     */
    each: function(callback, options) {
      options = options || {};

      if (this._order || this._skip || (this._limit >= 0)) {
        var error =
          "Cannot iterate on a query with sort, skip, or limit.";
        return AV.Promise.error(error)._thenRunCallbacks(options);
      }

      var promise = new AV.Promise();

      var query = new AV.Query(this.objectClass);
      // We can override the batch size from the options.
      // This is undocumented, but useful for testing.
      query._limit = options.batchSize || 100;
      query._where = _.clone(this._where);
      query._include = _.clone(this._include);

      query.ascending('objectId');

      var finished = false;
      return AV.Promise._continueWhile(function() {
        return !finished;

      }, function() {
        return query.find().then(function(results) {
          var callbacksDone = AV.Promise.as();
          AV._.each(results, function(result) {
            callbacksDone = callbacksDone.then(function() {
              return callback(result);
            });
          });

          return callbacksDone.then(function() {
            if (results.length >= query._limit) {
              query.greaterThan("objectId", results[results.length - 1].id);
            } else {
              finished = true;
            }
          });
        });
      })._thenRunCallbacks(options);
    }
  };

   AV.FriendShipQuery = AV.Query._extend({
     _objectClass: AV.User,
     _newObject: function(){
      return new AV.User();
    },
     _processResult: function(json){
      var user = json[this._friendshipTag];
      if(user.__type === 'Pointer' && user.className === '_User'){
        delete user.__type;
        delete user.className;
      }
      return user;
    },
   });
};

},{"underscore":28}],19:[function(require,module,exports){
'use strict';
var _ = require('underscore');

module.exports = function(AV) {
  /**
   * Creates a new Relation for the given parent object and key. This
   * constructor should rarely be used directly, but rather created by
   * AV.Object.relation.
   * @param {AV.Object} parent The parent of this relation.
   * @param {String} key The key for this relation on the parent.
   * @see AV.Object#relation
   * @class
   *
   * <p>
   * A class that is used to access all of the children of a many-to-many
   * relationship.  Each instance of AV.Relation is associated with a
   * particular parent object and key.
   * </p>
   */
  AV.Relation = function(parent, key) {
    if (! _.isString(key)) {
      throw new TypeError('key must be a string');
    }
    this.parent = parent;
    this.key = key;
    this.targetClassName = null;
  };

  /**
   * Creates a query that can be used to query the parent objects in this relation.
   * @param {String} parentClass The parent class or name.
   * @param {String} relationKey The relation field key in parent.
   * @param {AV.Object} child The child object.
   * @return {AV.Query}
   */
  AV.Relation.reverseQuery = function(parentClass, relationKey, child){
    var query = new AV.Query(parentClass);
    query.equalTo(relationKey, child._toPointer());
    return query;
  };

  AV.Relation.prototype = {
    /**
     * Makes sure that this relation has the right parent and key.
     */
    _ensureParentAndKey: function(parent, key) {
      this.parent = this.parent || parent;
      this.key = this.key || key;
      if (this.parent !== parent) {
        throw "Internal Error. Relation retrieved from two different Objects.";
      }
      if (this.key !== key) {
        throw "Internal Error. Relation retrieved from two different keys.";
      }
    },

    /**
     * Adds a AV.Object or an array of AV.Objects to the relation.
     * @param {} objects The item or items to add.
     */
    add: function(objects) {
      if (!_.isArray(objects)) {
        objects = [objects];
      }

      var change = new AV.Op.Relation(objects, []);
      this.parent.set(this.key, change);
      this.targetClassName = change._targetClassName;
    },

    /**
     * Removes a AV.Object or an array of AV.Objects from this relation.
     * @param {} objects The item or items to remove.
     */
    remove: function(objects) {
      if (!_.isArray(objects)) {
        objects = [objects];
      }

      var change = new AV.Op.Relation([], objects);
      this.parent.set(this.key, change);
      this.targetClassName = change._targetClassName;
    },

    /**
     * Returns a JSON version of the object suitable for saving to disk.
     * @return {Object}
     */
    toJSON: function() {
      return { "__type": "Relation", "className": this.targetClassName };
    },

    /**
     * Returns a AV.Query that is limited to objects in this
     * relation.
     * @return {AV.Query}
     */
    query: function() {
      var targetClass;
      var query;
      if (!this.targetClassName) {
        targetClass = AV.Object._getSubclass(this.parent.className);
        query = new AV.Query(targetClass);
        query._extraOptions.redirectClassNameForKey = this.key;
      } else {
        targetClass = AV.Object._getSubclass(this.targetClassName);
        query = new AV.Query(targetClass);
      }
      query._addCondition("$relatedTo", "object", this.parent._toPointer());
      query._addCondition("$relatedTo", "key", this.key);

      return query;
    }
  };
};

},{"underscore":28}],20:[function(require,module,exports){
'use strict';

var _ = require('underscore');

module.exports = function(AV) {
  /**
   * Represents a Role on the AV server. Roles represent groupings of
   * Users for the purposes of granting permissions (e.g. specifying an ACL
   * for an Object). Roles are specified by their sets of child users and
   * child roles, all of which are granted any permissions that the parent
   * role has.
   *
   * <p>Roles must have a name (which cannot be changed after creation of the
   * role), and must specify an ACL.</p>
   * @class
   * A AV.Role is a local representation of a role persisted to the AV
   * cloud.
   */
  AV.Role = AV.Object.extend("_Role", /** @lends AV.Role.prototype */ {
    // Instance Methods

    /**
     * Constructs a new AVRole with the given name and ACL.
     *
     * @param {String} name The name of the Role to create.
     * @param {AV.ACL} [acl] The ACL for this role. if absent, the default ACL
     *    `{'*': { read: true }}` will be used.
     */
    constructor: function(name, acl) {
      if (_.isString(name)) {
        AV.Object.prototype.constructor.call(this, null, null);
        this.setName(name);
      }
      if (acl === undefined) {
        var defaultAcl = new AV.ACL();
        defaultAcl.setPublicReadAccess(true);
        acl = defaultAcl;
      }
      if (!(acl instanceof AV.ACL)) {
        throw new TypeError('acl must be an instance of AV.ACL');
      }
      this.setACL(acl);
    },

    /**
     * Gets the name of the role.  You can alternatively call role.get("name")
     *
     * @return {String} the name of the role.
     */
    getName: function() {
      return this.get("name");
    },

    /**
     * Sets the name for a role. This value must be set before the role has
     * been saved to the server, and cannot be set once the role has been
     * saved.
     *
     * <p>
     *   A role's name can only contain alphanumeric characters, _, -, and
     *   spaces.
     * </p>
     *
     * <p>This is equivalent to calling role.set("name", name)</p>
     *
     * @param {String} name The name of the role.
     * @param {Object} options Standard options object with success and error
     *     callbacks.
     */
    setName: function(name, options) {
      return this.set("name", name, options);
    },

    /**
     * Gets the AV.Relation for the AV.Users that are direct
     * children of this role. These users are granted any privileges that this
     * role has been granted (e.g. read or write access through ACLs). You can
     * add or remove users from the role through this relation.
     *
     * <p>This is equivalent to calling role.relation("users")</p>
     *
     * @return {AV.Relation} the relation for the users belonging to this
     *     role.
     */
    getUsers: function() {
      return this.relation("users");
    },

    /**
     * Gets the AV.Relation for the AV.Roles that are direct
     * children of this role. These roles' users are granted any privileges that
     * this role has been granted (e.g. read or write access through ACLs). You
     * can add or remove child roles from this role through this relation.
     *
     * <p>This is equivalent to calling role.relation("roles")</p>
     *
     * @return {AV.Relation} the relation for the roles belonging to this
     *     role.
     */
    getRoles: function() {
      return this.relation("roles");
    },

    /**
     * @ignore
     */
    validate: function(attrs, options) {
      if ("name" in attrs && attrs.name !== this.getName()) {
        var newName = attrs.name;
        if (this.id && this.id !== attrs.objectId) {
          // Check to see if the objectId being set matches this.id.
          // This happens during a fetch -- the id is set before calling fetch.
          // Let the name be set in this case.
          return new AV.Error(AV.Error.OTHER_CAUSE,
              "A role's name can only be set before it has been saved.");
        }
        if (!_.isString(newName)) {
          return new AV.Error(AV.Error.OTHER_CAUSE,
              "A role's name must be a String.");
        }
        if (!(/^[0-9a-zA-Z\-_ ]+$/).test(newName)) {
          return new AV.Error(AV.Error.OTHER_CAUSE,
              "A role's name can only contain alphanumeric characters, _," +
              " -, and spaces.");
        }
      }
      if (AV.Object.prototype.validate) {
        return AV.Object.prototype.validate.call(this, attrs, options);
      }
      return false;
    }
  });
};

},{"underscore":28}],21:[function(require,module,exports){
'use strict';

var _ = require('underscore');

module.exports = function(AV) {
  /**
   * A builder to generate sort string for app searching.For example:
   * <pre><code>
   *   var builder = new AV.SearchSortBuilder();
   *   builder.ascending('key1').descending('key2','max');
   *   var query = new AV.SearchQuery('Player');
   *   query.sortBy(builder);
   *   query.find().then ...
   * </code></pre>
   * @class
   * @since 0.5.1
   */
  AV.SearchSortBuilder = function() {
    this._sortFields = [];
  };

  AV.SearchSortBuilder.prototype = {
    _addField: function(key, order, mode, missing) {
      var field = {};
      field[key] = {
        order: order || 'asc',
        mode: mode ||'avg',
        missing: '_' + (missing || 'last')
      };
      this._sortFields.push(field);
      return this;
    },


    /**
     * Sorts the results in ascending order by the given key and options.
     *
     * @param {String} key The key to order by.
     * @param {String} mode The sort mode, default is 'avg', you can choose
     *                  'max' or 'min' too.
     * @param {String} missing The missing key behaviour, default is 'last',
     *                  you can choose 'first' too.
     * @return {AV.SearchSortBuilder} Returns the builder, so you can chain this call.
     */
    ascending: function(key, mode, missing) {
      return this._addField(key, 'asc', mode, missing);
    },

    /**
     * Sorts the results in descending order by the given key and options.
     *
     * @param {String} key The key to order by.
     * @param {String} mode The sort mode, default is 'avg', you can choose
     *                  'max' or 'min' too.
     * @param {String} missing The missing key behaviour, default is 'last',
     *                  you can choose 'first' too.
     * @return {AV.SearchSortBuilder} Returns the builder, so you can chain this call.
     */
    descending: function(key, mode, missing) {
      return this._addField(key, 'desc', mode, missing);
    },

    /**
     * Add a proximity based constraint for finding objects with key point
     * values near the point given.
     * @param {String} key The key that the AV.GeoPoint is stored in.
     * @param {AV.GeoPoint} point The reference AV.GeoPoint that is used.
     * @param {Object} options The other options such as mode,order, unit etc.
     * @return {AV.SearchSortBuilder} Returns the builder, so you can chain this call.
     */
    whereNear: function(key, point, options) {
      options = options || {};
      var field = {};
      var geo = {
        lat: point.latitude,
        lon: point.longitude
      };
      var m = {
        order: options.order || 'asc',
        mode: options.mode || 'avg',
        unit: options.unit || 'km'
      };
      m[key] = geo;
      field['_geo_distance'] = m;

      this._sortFields.push(field);
      return this;
    },

    /**
     * Build a sort string by configuration.
     * @return {String} the sort string.
     */
    build: function() {
      return JSON.stringify(AV._encode(this._sortFields));
    }
  };

  /**
   * App searching query.Use just like AV.Query:
   * <pre><code>
   *   var query = new AV.SearchQuery('Player');
   *   query.queryString('*');
   *   query.find().then(function(results) {
   *     console.log('Found %d objects', query.hits());
   *     //Process results
   *   });
   *
   * </code></pre>
   * Visite <a href='https://leancloud.cn/docs/app_search_guide.html'>App Searching Guide</a>
   * for more details.
   * @class
   * @since 0.5.1
   *
   */
  AV.SearchQuery = AV.Query._extend(/** @lends AV.SearchQuery.prototype */{
     _sid: null,
     _hits:  0,
     _queryString: null,
     _highlights: null,
     _sortBuilder: null,
    _createRequest: function(params){
      return AV._request("search/select", null, null, "GET",
                                   params || this.toJSON());
    },

    /**
     * Sets the sid of app searching query.Default is null.
     * @param {String} sid  Scroll id for searching.
     * @return {AV.SearchQuery} Returns the query, so you can chain this call.
     */
    sid: function(sid) {
      this._sid = sid;
      return this;
    },

    /**
     * Sets the query string of app searching.
     * @param {String} q  The query string.
     * @return {AV.SearchQuery} Returns the query, so you can chain this call.
     */
    queryString: function(q) {
      this._queryString = q;
      return this;
    },


    /**
     * Sets the highlight fields. Such as
     * <pre><code>
     *   query.highlights('title');
     *   //or pass an array.
     *   query.highlights(['title', 'content'])
     * </code></pre>
     * @param {Array} highlights a list of fields.
     * @return {AV.SearchQuery} Returns the query, so you can chain this call.
     */
    highlights: function(highlights) {
      var objects;
      if (highlights && _.isString(highlights)) {
        objects = arguments;
      } else {
        objects = highlights;
      }
      this._highlights = objects;
      return this;
    },

    /**
     * Sets the sort builder for this query.
     * @see AV.SearchSortBuilder
     * @param { AV.SearchSortBuilder} builder The sort builder.
     * @return {AV.SearchQuery} Returns the query, so you can chain this call.
     *
     */
    sortBy: function(builder) {
      this._sortBuilder = builder;
      return this;
    },

    /**
     * Returns the number of objects that match this query.
     * @return {Number}
     */
    hits: function() {
       if (!this._hits) {
        this._hits = 0;
      }
      return this._hits;
    },

    _processResult: function(json){
       delete json['className'];
       delete json['_app_url'];
       delete json['_deeplink'];
       return json;
    },

    /**
     * Retrieves a list of AVObjects that satisfy this query.
     * Either options.success or options.error is called when the find
     * completes.
     *
     * @see AV.Query#find
     * @param {Object} options A Backbone-style options object.
     * @return {AV.Promise} A promise that is resolved with the results when
     * the query completes.
     */
    find: function(options) {
      var self = this;

      var request = this._createRequest();

      return request.then(function(response) {
        //update sid for next querying.
        if(response.sid) {
          self._oldSid = self._sid;
          self._sid = response.sid;
        }
        self._hits = response.hits || 0;

        return _.map(response.results, function(json) {
          if(json.className) {
            response.className = json.className;
          }
          var obj = self._newObject(response);
          obj.appURL = json['_app_url'];
          obj._finishFetch(self._processResult(json), true);
          return obj;
        });
      })._thenRunCallbacks(options);
    },

    toJSON: function(){
      var params = AV.SearchQuery.__super__.toJSON.call(this);
      delete params.where;
      if(this.className) {
        params.clazz = this.className;
      }
      if(this._sid) {
        params.sid = this._sid;
      }
      if(!this._queryString) {
        throw 'Please set query string.';
      } else {
        params.q = this._queryString;
      }
      if(this._highlights) {
        params.highlights = this._highlights.join(',');
      }
      if(this._sortBuilder && params.order) {
        throw 'sort and order can not be set at same time.';
      }
      if(this._sortBuilder) {
        params.sort = this._sortBuilder.build();
      }

      return params;
    }
  });
};

},{"underscore":28}],22:[function(require,module,exports){
'use strict';

var _ = require('underscore');

module.exports = function(AV) {
  /**
   * Contains functions to deal with Status in AVOS Cloud.
   * @name AV.Status
   * @namespace
   */
  AV.Status = function(imageUrl, message) {
    this.data = {};
    this.inboxType = 'default';
    this.query = null;
    if(imageUrl && typeof imageUrl === 'object') {
        this.data = imageUrl;
    } else {
      if(imageUrl){
        this.data.image = imageUrl;
      }
      if(message){
        this.data.message = message;
      }
    }
    return this;
  };

  AV.Status.prototype = {
    /**
     * Gets the value of an attribute in status data.
     * @param {String} attr The string name of an attribute.
     */
    get: function(attr){
      return this.data[attr];
    },
    /**
     * Sets a hash of model attributes on the status data.
     * @param {String} key The key to set.
     * @param {} value The value to give it.
     */
    set: function(key, value){
      this.data[key] = value;
      return this;
    },
    /**
     * Destroy this status,then it will not be avaiable in other user's inboxes.
     * @param {Object} options An optional Backbone-like options object with
     *     success and error callbacks that will be invoked once the iteration
     *     has finished.
     * @return {AV.Promise} A promise that is fulfilled when the destroy
     *     completes.
     */
    destroy: function(options){
      if(!this.id)
        return AV.Promise.error('The status id is not exists.')._thenRunCallbacks(options);
      var request = AV._request("statuses", null, this.id, 'DELETE');
      return request._thenRunCallbacks(options);
    },
    /**
      * Cast the AV.Status object to an AV.Object pointer.
      * @return {AV.Object} A AV.Object pointer.
      */
    toObject: function(){
      if(!this.id)
          return null;
      return AV.Object.createWithoutData('_Status', this.id);
    },
    _getDataJSON: function() {
      var json = AV._.clone(this.data);
      return AV._encode(json);
    },
   /**
    * Send  a status by a AV.Query object.
    * <p>For example,send a status to male users:<br/><pre>
    *     var status = new AVStatus('image url', 'a message');
    *     status.query = new AV.Query('_User');
    *     status.query.equalTo('gender', 'male');
    *     status.send().then(function(){
    *              //send status successfully.
    *      }, function(err){
    *             //an error threw.
    *             console.dir(err);
    *      });
    * </pre></p>
    * @since 0.3.0
    * @param {Object} options An optional Backbone-like options object with
    *     success and error callbacks that will be invoked once the iteration
    *     has finished.
    * @return {AV.Promise} A promise that is fulfilled when the send
    *     completes.
    */
    send: function(options){
      if(!AV.User.current()){
        throw 'Please signin an user.';
      }
      if(!this.query){
        return AV.Status.sendStatusToFollowers(this, options);
      }

      var query = this.query.toJSON();
      query.className = this.query.className;
      var data = {};
      data.query = query;
      this.data = this.data || {};
      var currUser =  AV.Object.createWithoutData('_User', AV.User.current().id)._toPointer();
      this.data.source =  this.data.source || currUser;
      data.data = this._getDataJSON();
      data.inboxType = this.inboxType || 'default';

      var request = AV._request('statuses', null, null, 'POST', data);
      var self = this;
      return request.then(function(response){
        self.id = response.objectId;
        self.createdAt = AV._parseDate(response.createdAt);
        return self;
      })._thenRunCallbacks(options);
    },

    _finishFetch: function(serverData){
        this.id = serverData.objectId;
        this.createdAt = AV._parseDate(serverData.createdAt);
        this.updatedAt = AV._parseDate(serverData.updatedAt);
        this.messageId = serverData.messageId;
        delete serverData.messageId;
        delete serverData.objectId;
        delete serverData.createdAt;
        delete serverData.updatedAt;
        this.data = AV._decode(undefined, serverData);
    }
  };

  /**
   * Send  a status to current signined user's followers.For example:
   * <p><pre>
   *     var status = new AVStatus('image url', 'a message');
   *     AV.Status.sendStatusToFollowers(status).then(function(){
   *              //send status successfully.
   *      }, function(err){
   *             //an error threw.
   *             console.dir(err);
   *      });
   * </pre></p>
   * @since 0.3.0
   * @param {AV.Status} status  A status object to be send to followers.
   * @param {Object} options An optional Backbone-like options object with
   *     success and error callbacks that will be invoked once the iteration
   *     has finished.
   * @return {AV.Promise} A promise that is fulfilled when the send
   *     completes.
   */
  AV.Status.sendStatusToFollowers = function(status, options) {
    if(!AV.User.current()){
      throw 'Please signin an user.';
    }
    var query = {};
    query.className = '_Follower';
    query.keys = 'follower';
    var currUser =  AV.Object.createWithoutData('_User', AV.User.current().id). _toPointer();
    query.where = {user: currUser};
    var data = {};
    data.query = query;
    status.data = status.data || {};
    status.data.source =  status.data.source || currUser;
    data.data = status._getDataJSON();
    data.inboxType = status.inboxType || 'default';

    var request = AV._request('statuses', null, null, 'POST', data);
    return request.then(function(response){
      status.id = response.objectId;
      status.createdAt = AV._parseDate(response.createdAt);
      return status;
    })._thenRunCallbacks(options);
  };

  /**
   * <p>Send  a status from current signined user to other user's private status inbox.</p>
   * <p>For example,send a private status to user '52e84e47e4b0f8de283b079b':<br/>
   * <pre>
   *    var status = new AVStatus('image url', 'a message');
   *     AV.Status.sendPrivateStatus(status, '52e84e47e4b0f8de283b079b').then(function(){
   *              //send status successfully.
   *      }, function(err){
   *             //an error threw.
   *             console.dir(err);
   *      });
   * </pre></p>
   * @since 0.3.0
   * @param {AV.Status} status  A status object to be send to followers.
   * @param {} target The target user or user's objectId.
   * @param {Object} options An optional Backbone-like options object with
   *     success and error callbacks that will be invoked once the iteration
   *     has finished.
   * @return {AV.Promise} A promise that is fulfilled when the send
   *     completes.
   */
  AV.Status.sendPrivateStatus = function(status, target, options) {
    if(!AV.User.current()){
      throw 'Please signin an user.';
    }
    if(!target){
          throw "Invalid target user.";
    }
    var userObjectId = _.isString(target) ? target: target.id;
    if(!userObjectId){
        throw "Invalid target user.";
    }

    var query = {};
    query.className = '_User';
    var currUser =  AV.Object.createWithoutData('_User', AV.User.current().id). _toPointer();
    query.where = {objectId: userObjectId};
    var data = {};
    data.query = query;
    status.data = status.data || {};
    status.data.source =  status.data.source || currUser;
    data.data = status._getDataJSON();
    data.inboxType = 'private';
    status.inboxType = 'private';

    var request = AV._request('statuses', null, null, 'POST', data);
    return request.then(function(response){
      status.id = response.objectId;
      status.createdAt = AV._parseDate(response.createdAt);
      return status;
    })._thenRunCallbacks(options);
  };

  /**
   * Count unread statuses in someone's inbox.For example:<br/>
   * <p><pre>
   *  AV.Status.countUnreadStatuses(AV.User.current()).then(function(response){
   *    console.log(response.unread); //unread statuses number.
   *    console.log(response.total);  //total statuses number.
   *  });
   * </pre></p>
   * @since 0.3.0
   * @param {Object} source The status source.
   * @return {AV.Query} The query object for status.
   * @return {AV.Promise} A promise that is fulfilled when the count
   *     completes.
   */
  AV.Status.countUnreadStatuses = function(owner){
    if(!AV.User.current() && owner == null){
      throw 'Please signin an user or pass the owner objectId.';
    }
    owner = owner || AV.User.current();
    var options = !_.isString(arguments[1]) ? arguments[1] : arguments[2];
    var inboxType =  !_.isString(arguments[1]) ? 'default' : arguments[1];
    var params = {};
    params.inboxType = AV._encode(inboxType);
    params.owner = AV._encode(owner);
    var request = AV._request('subscribe/statuses/count', null, null, 'GET', params);
    return request._thenRunCallbacks(options);
  };

  /**
   * Create a status query to find someone's published statuses.For example:<br/>
   * <p><pre>
   *   //Find current user's published statuses.
   *   var query = AV.Status.statusQuery(AV.User.current());
   *   query.find().then(function(statuses){
   *      //process statuses
   *   });
   * </pre></p>
   * @since 0.3.0
   * @param {Object} source The status source.
   * @return {AV.Query} The query object for status.
   */
  AV.Status.statusQuery = function(source){
    var query = new AV.Query('_Status');
    if(source){
      query.equalTo('source', source);
    }
    return query;
  };

   /**
    * <p>AV.InboxQuery defines a query that is used to fetch somebody's inbox statuses.</p>
    * @see AV.Status#inboxQuery
    * @class
    */
   AV.InboxQuery = AV.Query._extend(/** @lends AV.InboxQuery.prototype */{
     _objectClass: AV.Status,
     _sinceId: 0,
     _maxId:  0,
     _inboxType: 'default',
     _owner: null,
     _newObject: function(){
      return new AV.Status();
    },
    _createRequest: function(params){
      return AV._request("subscribe/statuses", null, null, "GET",
                                   params || this.toJSON());
    },


    /**
     * Sets the messageId of results to skip before returning any results.
     * This is useful for pagination.
     * Default is zero.
     * @param {Number} n the mesage id.
     * @return {AV.InboxQuery} Returns the query, so you can chain this call.
     */
    sinceId: function(id){
      this._sinceId = id;
      return this;
    },
    /**
     * Sets the maximal messageId of results。
     * This is useful for pagination.
     * Default is zero that is no limition.
     * @param {Number} n the mesage id.
     * @return {AV.InboxQuery} Returns the query, so you can chain this call.
     */
    maxId: function(id){
      this._maxId = id;
      return this;
    },
    /**
     * Sets the owner of the querying inbox.
     * @param {Object} owner The inbox owner.
     * @return {AV.InboxQuery} Returns the query, so you can chain this call.
     */
    owner: function(owner){
      this._owner = owner;
      return this;
    },
    /**
     * Sets the querying inbox type.default is 'default'.
     * @param {Object} owner The inbox type.
     * @return {AV.InboxQuery} Returns the query, so you can chain this call.
     */
    inboxType: function(type){
      this._inboxType = type;
      return this;
    },
    toJSON: function(){
      var params = AV.InboxQuery.__super__.toJSON.call(this);
      params.owner = AV._encode(this._owner);
      params.inboxType = AV._encode(this._inboxType);
      params.sinceId = AV._encode(this._sinceId);
      params.maxId = AV._encode(this._maxId);
      return params;
    }
   });

  /**
   * Create a inbox status query to find someone's inbox statuses.For example:<br/>
   * <p><pre>
   *   //Find current user's default inbox statuses.
   *   var query = AV.Status.inboxQuery(AV.User.current());
   *   //find the statuses after the last message id
   *   query.sinceId(lastMessageId);
   *   query.find().then(function(statuses){
   *      //process statuses
   *   });
   * </pre></p>
   * @since 0.3.0
   * @param {Object} owner The inbox's owner
   * @param {String} inboxType The inbox type,'default' by default.
   * @return {AV.InboxQuery} The inbox query object.
   * @see AV.InboxQuery
   */
  AV.Status.inboxQuery = function(owner, inboxType){
    var query = new AV.InboxQuery(AV.Status);
    if(owner){
      query._owner = owner;
    }
    if(inboxType){
      query._inboxType = inboxType;
    }
    return query;
  };

};

},{"underscore":28}],23:[function(require,module,exports){
'use strict';

var _ = require('underscore');

module.exports = function(AV) {
  /**
   * @class
   *
   * <p>A AV.User object is a local representation of a user persisted to the
   * AV cloud. This class is a subclass of a AV.Object, and retains the
   * same functionality of a AV.Object, but also extends it with various
   * user specific methods, like authentication, signing up, and validation of
   * uniqueness.</p>
   */
  AV.User = AV.Object.extend("_User", /** @lends AV.User.prototype */ {
    // Instance Variables
    _isCurrentUser: false,


    // Instance Methods

    /**
     * Internal method to handle special fields in a _User response.
     */
    _mergeMagicFields: function(attrs) {
      if (attrs.sessionToken) {
        this._sessionToken = attrs.sessionToken;
        delete attrs.sessionToken;
      }
      AV.User.__super__._mergeMagicFields.call(this, attrs);
    },

    /**
     * Removes null values from authData (which exist temporarily for
     * unlinking)
     */
    _cleanupAuthData: function() {
      if (!this.isCurrent()) {
        return;
      }
      var authData = this.get('authData');
      if (!authData) {
        return;
      }
      AV._objectEach(this.get('authData'), function(value, key) {
        if (!authData[key]) {
          delete authData[key];
        }
      });
    },

    /**
     * Synchronizes authData for all providers.
     */
    _synchronizeAllAuthData: function() {
      var authData = this.get('authData');
      if (!authData) {
        return;
      }

      var self = this;
      AV._objectEach(this.get('authData'), function(value, key) {
        self._synchronizeAuthData(key);
      });
    },

    /**
     * Synchronizes auth data for a provider (e.g. puts the access token in the
     * right place to be used by the Facebook SDK).
     */
    _synchronizeAuthData: function(provider) {
      if (!this.isCurrent()) {
        return;
      }
      var authType;
      if (_.isString(provider)) {
        authType = provider;
        provider = AV.User._authProviders[authType];
      } else {
        authType = provider.getAuthType();
      }
      var authData = this.get('authData');
      if (!authData || !provider) {
        return;
      }
      var success = provider.restoreAuthentication(authData[authType]);
      if (!success) {
        this._unlinkFrom(provider);
      }
    },

    _handleSaveResult: function(makeCurrent) {
      // Clean up and synchronize the authData object, removing any unset values
      if (makeCurrent) {
        this._isCurrentUser = true;
      }
      this._cleanupAuthData();
      this._synchronizeAllAuthData();
      // Don't keep the password around.
      delete this._serverData.password;
      this._rebuildEstimatedDataForKey("password");
      this._refreshCache();
      if (makeCurrent || this.isCurrent()) {
        AV.User._saveCurrentUser(this);
      }
    },

    /**
     * Unlike in the Android/iOS SDKs, logInWith is unnecessary, since you can
     * call linkWith on the user (even if it doesn't exist yet on the server).
     */
    _linkWith: function(provider, options) {
      var authType;
      if (_.isString(provider)) {
        authType = provider;
        provider = AV.User._authProviders[provider];
      } else {
        authType = provider.getAuthType();
      }
      if (_.has(options, 'authData')) {
        var authData = this.get('authData') || {};
        authData[authType] = options.authData;
        this.set('authData', authData);

        // Overridden so that the user can be made the current user.
        var newOptions = _.clone(options) || {};
        newOptions.success = function(model) {
          model._handleSaveResult(true);
          if (options.success) {
            options.success.apply(this, arguments);
          }
        };
        return this.save({'authData': authData}, newOptions);
      } else {
        var self = this;
        var promise = new AV.Promise();
        provider.authenticate({
          success: function(provider, result) {
            self._linkWith(provider, {
              authData: result,
              success: options.success,
              error: options.error
            }).then(function() {
              promise.resolve(self);
            });
          },
          error: function(provider, error) {
            if (options.error) {
              options.error(self, error);
            }
            promise.reject(error);
          }
        });
        return promise;
      }
    },

    /**
     * Unlinks a user from a service.
     */
    _unlinkFrom: function(provider, options) {
      var authType;
      if (_.isString(provider)) {
        authType = provider;
        provider = AV.User._authProviders[provider];
      } else {
        authType = provider.getAuthType();
      }
      var newOptions = _.clone(options);
      var self = this;
      newOptions.authData = null;
      newOptions.success = function(model) {
        self._synchronizeAuthData(provider);
        if (options.success) {
          options.success.apply(this, arguments);
        }
      };
      return this._linkWith(provider, newOptions);
    },

    /**
     * Checks whether a user is linked to a service.
     */
    _isLinked: function(provider) {
      var authType;
      if (_.isString(provider)) {
        authType = provider;
      } else {
        authType = provider.getAuthType();
      }
      var authData = this.get('authData') || {};
      return !!authData[authType];
    },

    /**
     * Deauthenticates all providers.
     */
    _logOutWithAll: function() {
      var authData = this.get('authData');
      if (!authData) {
        return;
      }
      var self = this;
      AV._objectEach(this.get('authData'), function(value, key) {
        self._logOutWith(key);
      });
    },

    /**
     * Deauthenticates a single provider (e.g. removing access tokens from the
     * Facebook SDK).
     */
    _logOutWith: function(provider) {
      if (!this.isCurrent()) {
        return;
      }
      if (_.isString(provider)) {
        provider = AV.User._authProviders[provider];
      }
      if (provider && provider.deauthenticate) {
        provider.deauthenticate();
      }
    },

    /**
     * Signs up a new user. You should call this instead of save for
     * new AV.Users. This will create a new AV.User on the server, and
     * also persist the session on disk so that you can access the user using
     * <code>current</code>.
     *
     * <p>A username and password must be set before calling signUp.</p>
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {Object} attrs Extra fields to set on the new user, or null.
     * @param {Object} options A Backbone-style options object.
     * @return {AV.Promise} A promise that is fulfilled when the signup
     *     finishes.
     * @see AV.User.signUp
     */
    signUp: function(attrs, options) {
      var error;
      options = options || {};

      var username = (attrs && attrs.username) || this.get("username");
      if (!username || (username === "")) {
        error = new AV.Error(
            AV.Error.OTHER_CAUSE,
            "Cannot sign up user with an empty name.");
        if (options && options.error) {
          options.error(this, error);
        }
        return AV.Promise.error(error);
      }

      var password = (attrs && attrs.password) || this.get("password");
      if (!password || (password === "")) {
        error = new AV.Error(
            AV.Error.OTHER_CAUSE,
            "Cannot sign up user with an empty password.");
        if (options && options.error) {
          options.error(this, error);
        }
        return AV.Promise.error(error);
      }

      // Overridden so that the user can be made the current user.
      var newOptions = _.clone(options);
      newOptions.success = function(model) {
        model._handleSaveResult(true);
        if (options.success) {
          options.success.apply(this, arguments);
        }
      };
      return this.save(attrs, newOptions);
    },

    /**
     * Signs up a new user with mobile phone and sms code.
     * You should call this instead of save for
     * new AV.Users. This will create a new AV.User on the server, and
     * also persist the session on disk so that you can access the user using
     * <code>current</code>.
     *
     * <p>A username and password must be set before calling signUp.</p>
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {Object} attrs Extra fields to set on the new user, or null.
     * @param {Object} options A Backbone-style options object.
     * @return {AV.Promise} A promise that is fulfilled when the signup
     *     finishes.
     * @see AV.User.signUpOrlogInWithMobilePhone
     * @see AV.Cloud.requestSmsCode
     */
    signUpOrlogInWithMobilePhone: function(attrs, options) {
      var error;
      options = options || {};

      var mobilePhoneNumber = (attrs && attrs.mobilePhoneNumber) ||
                              this.get("mobilePhoneNumber");
      if (!mobilePhoneNumber || (mobilePhoneNumber === "")) {
        error = new AV.Error(
            AV.Error.OTHER_CAUSE,
            "Cannot sign up or login user by mobilePhoneNumber " +
            "with an empty mobilePhoneNumber.");
        if (options && options.error) {
          options.error(this, error);
        }
        return AV.Promise.error(error);
      }

      var smsCode = (attrs && attrs.smsCode) || this.get("smsCode");
      if (!smsCode || (smsCode === "")) {
        error = new AV.Error(
            AV.Error.OTHER_CAUSE,
             "Cannot sign up or login user by mobilePhoneNumber  " +
             "with an empty smsCode.");
        if (options && options.error) {
          options.error(this, error);
        }
        return AV.Promise.error(error);
      }

      // Overridden so that the user can be made the current user.
      var newOptions = _.clone(options);
      newOptions._makeRequest = function(route, className, id, method, json) {
        return AV._request('usersByMobilePhone', null, null, "POST", json);
      };
      newOptions.success = function(model) {
        model._handleSaveResult(true);
        delete model.attributes.smsCode;
        delete model._serverData.smsCode;
        if (options.success) {
          options.success.apply(this, arguments);
        }
      };
      return this.save(attrs, newOptions);
    },

    /**
     * Logs in a AV.User. On success, this saves the session to localStorage,
     * so you can retrieve the currently logged in user using
     * <code>current</code>.
     *
     * <p>A username and password must be set before calling logIn.</p>
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {Object} options A Backbone-style options object.
     * @see AV.User.logIn
     * @return {AV.Promise} A promise that is fulfilled with the user when
     *     the login is complete.
     */
    logIn: function(options) {
      var model = this;
      var request = AV._request("login", null, null, "GET", this.toJSON());
      return request.then(function(resp, status, xhr) {
        var serverAttrs = model.parse(resp, status, xhr);
        model._finishFetch(serverAttrs);
        model._handleSaveResult(true);
        if(!serverAttrs.smsCode)
          delete model.attributes['smsCode'];
        return model;
      })._thenRunCallbacks(options, this);
    },

    /**
     * @see AV.Object#save
     */
    save: function(arg1, arg2, arg3) {
      var i, attrs, current, options, saved;
      if (_.isObject(arg1) || _.isNull(arg1) || _.isUndefined(arg1)) {
        attrs = arg1;
        options = arg2;
      } else {
        attrs = {};
        attrs[arg1] = arg2;
        options = arg3;
      }
      options = options || {};

      var newOptions = _.clone(options);
      newOptions.success = function(model) {
        model._handleSaveResult(false);
        if (options.success) {
          options.success.apply(this, arguments);
        }
      };
      return AV.Object.prototype.save.call(this, attrs, newOptions);
    },

    /**
     * Follow a user
     * @since 0.3.0
     * @param {} target The target user or user's objectId to follow.
     * @param {Object} options An optional Backbone-like options object with
     *     success and error callbacks that will be invoked once the iteration
     *     has finished.
     */
    follow: function(target, options){
      if(!this.id){
          throw "Please signin.";
      }
      if(!target){
          throw "Invalid target user.";
      }
      var userObjectId = _.isString(target) ? target: target.id;
      if(!userObjectId){
          throw "Invalid target user.";
      }
      var route = 'users/' + this.id + '/friendship/' + userObjectId;
      var request = AV._request(route, null, null, 'POST', null);
      return request._thenRunCallbacks(options);
    },

    /**
     * Unfollow a user.
     * @since 0.3.0
     * @param {} target The target user or user's objectId to unfollow.
     * @param options {Object} An optional Backbone-like options object with
     *     success and error callbacks that will be invoked once the iteration
     *     has finished.
     */
    unfollow: function(target, options){
      if(!this.id){
          throw "Please signin.";
      }
      if(!target){
          throw "Invalid target user.";
      }
      var userObjectId = _.isString(target) ? target: target.id;
      if(!userObjectId){
          throw "Invalid target user.";
      }
      var route = 'users/' + this.id + '/friendship/' + userObjectId;
      var request = AV._request(route, null, null, 'DELETE', null);
      return request._thenRunCallbacks(options);
    },

    /**
     *Create a follower query to query the user's followers.
     * @since 0.3.0
     * @see AV.User#followerQuery
     */
    followerQuery: function() {
        return AV.User.followerQuery(this.id);
    },

    /**
     *Create a followee query to query the user's followees.
     * @since 0.3.0
     * @see AV.User#followeeQuery
     */
    followeeQuery: function() {
        return AV.User.followeeQuery(this.id);
    },

    /**
     * @see AV.Object#fetch
     */
    fetch: function(options) {
      var newOptions = options ? _.clone(options) : {};
      newOptions.success = function(model) {
        model._handleSaveResult(false);
        if (options && options.success) {
          options.success.apply(this, arguments);
        }
      };
      return AV.Object.prototype.fetch.call(this, newOptions);
    },

    /**
     * Update user's new password safely based on old password.
     * @param {String} oldPassword, the old password.
     * @param {String} newPassword, the new password.
     * @param {Object} An optional Backbone-like options object with
     *     success and error callbacks that will be invoked once the iteration
     *     has finished.
     */
    updatePassword: function(oldPassword, newPassword, options) {
      var route = 'users/' + this.id + '/updatePassword';
      var params = {
        old_password: oldPassword,
        new_password: newPassword
      };
      var request = AV._request(route, null, null, 'PUT', params);
      return request._thenRunCallbacks(options, this);
    },

    /**
     * Returns true if <code>current</code> would return this user.
     * @see AV.User#current
     */
    isCurrent: function() {
      return this._isCurrentUser;
    },

    /**
     * Returns get("username").
     * @return {String}
     * @see AV.Object#get
     */
    getUsername: function() {
      return this.get("username");
    },

    /**
     * Returns get("mobilePhoneNumber").
     * @return {String}
     * @see AV.Object#get
     */
    getMobilePhoneNumber: function(){
      return this.get("mobilePhoneNumber");
    },

    /**
     * Calls set("mobilePhoneNumber", phoneNumber, options) and returns the result.
     * @param {String} mobilePhoneNumber
     * @param {Object} options A Backbone-style options object.
     * @return {Boolean}
     * @see AV.Object.set
     */
    setMobilePhoneNumber: function(phone, options) {
      return this.set("mobilePhoneNumber", phone, options);
    },

    /**
     * Calls set("username", username, options) and returns the result.
     * @param {String} username
     * @param {Object} options A Backbone-style options object.
     * @return {Boolean}
     * @see AV.Object.set
     */
    setUsername: function(username, options) {
      return this.set("username", username, options);
    },

    /**
     * Calls set("password", password, options) and returns the result.
     * @param {String} password
     * @param {Object} options A Backbone-style options object.
     * @return {Boolean}
     * @see AV.Object.set
     */
    setPassword: function(password, options) {
      return this.set("password", password, options);
    },

    /**
     * Returns get("email").
     * @return {String}
     * @see AV.Object#get
     */
    getEmail: function() {
      return this.get("email");
    },

    /**
     * Calls set("email", email, options) and returns the result.
     * @param {String} email
     * @param {Object} options A Backbone-style options object.
     * @return {Boolean}
     * @see AV.Object.set
     */
    setEmail: function(email, options) {
      return this.set("email", email, options);
    },

    /**
     * Checks whether this user is the current user and has been authenticated.
     * @return (Boolean) whether this user is the current user and is logged in.
     */
    authenticated: function() {
      return !!this._sessionToken &&
          (AV.User.current() && AV.User.current().id === this.id);
    }

  }, /** @lends AV.User */ {
    // Class Variables

    // The currently logged-in user.
    _currentUser: null,

    // Whether currentUser is known to match the serialized version on disk.
    // This is useful for saving a localstorage check if you try to load
    // _currentUser frequently while there is none stored.
    _currentUserMatchesDisk: false,

    // The localStorage key suffix that the current user is stored under.
    _CURRENT_USER_KEY: "currentUser",

    // The mapping of auth provider names to actual providers
    _authProviders: {},


    // Class Methods

    /**
     * Signs up a new user with a username (or email) and password.
     * This will create a new AV.User on the server, and also persist the
     * session in localStorage so that you can access the user using
     * {@link #current}.
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {String} username The username (or email) to sign up with.
     * @param {String} password The password to sign up with.
     * @param {Object} attrs Extra fields to set on the new user.
     * @param {Object} options A Backbone-style options object.
     * @return {AV.Promise} A promise that is fulfilled with the user when
     *     the signup completes.
     * @see AV.User#signUp
     */
    signUp: function(username, password, attrs, options) {
      attrs = attrs || {};
      attrs.username = username;
      attrs.password = password;
      var user = AV.Object._create("_User");
      return user.signUp(attrs, options);
    },

    /**
     * Logs in a user with a username (or email) and password. On success, this
     * saves the session to disk, so you can retrieve the currently logged in
     * user using <code>current</code>.
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {String} username The username (or email) to log in with.
     * @param {String} password The password to log in with.
     * @param {Object} options A Backbone-style options object.
     * @return {AV.Promise} A promise that is fulfilled with the user when
     *     the login completes.
     * @see AV.User#logIn
     */
    logIn: function(username, password, options) {
      var user = AV.Object._create("_User");
      user._finishFetch({ username: username, password: password });
      return user.logIn(options);
    },

    /**
     * Logs in a user with a session token. On success, this saves the session
     * to disk, so you can retrieve the currently logged in user using
     * <code>current</code>.
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {String} sessionToken The sessionToken to log in with.
     * @param {Object} options A Backbone-style options object.
     * @return {AV.Promise} A promise that is fulfilled with the user when
     *     the login completes.
     */
    become: function(sessionToken, options) {
      options = options || {};

      var user = AV.Object._create("_User");
      return AV._request(
          "users",
          "me",
          null,
          "GET",
          {
            useMasterKey: options.useMasterKey,
            session_token: sessionToken
          }
      ).then(function(resp, status, xhr) {
          var serverAttrs = user.parse(resp, status, xhr);
          user._finishFetch(serverAttrs);
          user._handleSaveResult(true);
          return user;

      })._thenRunCallbacks(options, user);
    },

    /**
     * Logs in a user with a mobile phone number and sms code sent by
     * AV.User.requestLoginSmsCode.On success, this
     * saves the session to disk, so you can retrieve the currently logged in
     * user using <code>current</code>.
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {String} mobilePhone The user's mobilePhoneNumber
     * @param {String} smsCode The sms code sent by AV.User.requestLoginSmsCode
     * @param {Object} options A Backbone-style options object.
     * @return {AV.Promise} A promise that is fulfilled with the user when
     *     the login completes.
     * @see AV.User#logIn
     */
   logInWithMobilePhoneSmsCode: function(mobilePhone, smsCode, options){
      var user = AV.Object._create("_User");
      user._finishFetch({ mobilePhoneNumber: mobilePhone, smsCode: smsCode });
      return user.logIn(options);
   },

    /**
     * Sign up or logs in a user with a mobilePhoneNumber and smsCode.
     * On success, this saves the session to disk, so you can retrieve the currently
     * logged in user using <code>current</code>.
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {String} mobilePhoneNumber The user's mobilePhoneNumber.
     * @param {String} smsCode The sms code sent by AV.Cloud.requestSmsCode
     * @param {Object} attributes  The user's other attributes such as username etc.
     * @param {Object} options A Backbone-style options object.
     * @return {AV.Promise} A promise that is fulfilled with the user when
     *     the login completes.
     * @see AV.User#signUpOrlogInWithMobilePhone
     * @see AV.Cloud.requestSmsCode
     */
    signUpOrlogInWithMobilePhone: function(mobilePhoneNumber, smsCode, attrs, options) {
      attrs = attrs || {};
      attrs.mobilePhoneNumber = mobilePhoneNumber;
      attrs.smsCode = smsCode;
      var user = AV.Object._create("_User");
      return user.signUpOrlogInWithMobilePhone(attrs, options);
    },


    /**
     * Logs in a user with a mobile phone number and password. On success, this
     * saves the session to disk, so you can retrieve the currently logged in
     * user using <code>current</code>.
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {String} mobilePhone The user's mobilePhoneNumber
     * @param {String} password The password to log in with.
     * @param {Object} options A Backbone-style options object.
     * @return {AV.Promise} A promise that is fulfilled with the user when
     *     the login completes.
     * @see AV.User#logIn
     */
   logInWithMobilePhone: function(mobilePhone, password, options){
      var user = AV.Object._create("_User");
      user._finishFetch({ mobilePhoneNumber: mobilePhone, password: password });
      return user.logIn(options);
   },

    /**
     * Logs out the currently logged in user session. This will remove the
     * session from disk, log out of linked services, and future calls to
     * <code>current</code> will return <code>null</code>.
     */
    logOut: function() {
      if (AV.User._currentUser !== null) {
        AV.User._currentUser._logOutWithAll();
        AV.User._currentUser._isCurrentUser = false;
      }
      AV.User._currentUserMatchesDisk = true;
      AV.User._currentUser = null;
      AV.localStorage.removeItem(
          AV._getAVPath(AV.User._CURRENT_USER_KEY));
    },

    /**
     *Create a follower query for special user to query the user's followers.
     * @param userObjectId {String} The user object id.
     * @since 0.3.0
     */
    followerQuery: function(userObjectId) {
        if(!userObjectId || !_.isString(userObjectId)) {
          throw "Invalid user object id.";
        }
        var query = new AV.FriendShipQuery('_Follower');
        query._friendshipTag ='follower';
        query.equalTo('user', AV.Object.createWithoutData('_User', userObjectId));
        return query;
    },

    /**
     *Create a followee query for special user to query the user's followees.
     * @param userObjectId {String} The user object id.
     * @since 0.3.0
     */
    followeeQuery: function(userObjectId) {
        if(!userObjectId || !_.isString(userObjectId)) {
          throw "Invalid user object id.";
        }
        var query = new AV.FriendShipQuery('_Followee');
        query._friendshipTag ='followee';
        query.equalTo('user', AV.Object.createWithoutData('_User', userObjectId));
        return query;
    },

    /**
     * Requests a password reset email to be sent to the specified email address
     * associated with the user account. This email allows the user to securely
     * reset their password on the AV site.
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {String} email The email address associated with the user that
     *     forgot their password.
     * @param {Object} options A Backbone-style options object.
     */
    requestPasswordReset: function(email, options) {
      var json = { email: email };
      var request = AV._request("requestPasswordReset", null, null, "POST",
                                   json);
      return request._thenRunCallbacks(options);
    },

    /**
     * Requests a verify email to be sent to the specified email address
     * associated with the user account. This email allows the user to securely
     * verify their email address on the AV site.
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {String} email The email address associated with the user that
     *     doesn't verify their email address.
     * @param {Object} options A Backbone-style options object.
     */
    requestEmailVerify: function(email, options) {
      var json = { email: email };
      var request = AV._request("requestEmailVerify", null, null, "POST",
                                   json);
      return request._thenRunCallbacks(options);
    },

   /**
    * @Deprecated typo error, please use requestEmailVerify
    */
    requestEmailVerfiy: function(email, options) {
      var json = { email: email };
      var request = AV._request("requestEmailVerify", null, null, "POST",
                                   json);
      return request._thenRunCallbacks(options);
    },

    /**
     * Requests a verify sms code to be sent to the specified mobile phone
     * number associated with the user account. This sms code allows the user to
     * verify their mobile phone number by calling AV.User.verifyMobilePhone
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {String} mobilePhone The mobile phone number  associated with the
     *                  user that doesn't verify their mobile phone number.
     * @param {Object} options A Backbone-style options object.
     */
    requestMobilePhoneVerify: function(mobilePhone, options){
      var json = { mobilePhoneNumber: mobilePhone };
      var request = AV._request("requestMobilePhoneVerify", null, null, "POST",
                                   json);
      return request._thenRunCallbacks(options);
    },


    /**
     * Requests a reset password sms code to be sent to the specified mobile phone
     * number associated with the user account. This sms code allows the user to
     * reset their account's password by calling AV.User.resetPasswordBySmsCode
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {String} mobilePhone The mobile phone number  associated with the
     *                  user that doesn't verify their mobile phone number.
     * @param {Object} options A Backbone-style options object.
     */
    requestPasswordResetBySmsCode: function(mobilePhone, options){
      var json = { mobilePhoneNumber: mobilePhone };
      var request = AV._request("requestPasswordResetBySmsCode", null, null, "POST",
                                   json);
      return request._thenRunCallbacks(options);
    },

    /**
     * Makes a call to reset user's account password by sms code and new password.
    * The sms code is sent by AV.User.requestPasswordResetBySmsCode.
     * @param {String} code The sms code sent by AV.User.Cloud.requestSmsCode
     * @param {String} password The new password.
     * @param {Object} options A Backbone-style options object
     * @return {AV.Promise} A promise that will be resolved with the result
     * of the function.
     */
    resetPasswordBySmsCode: function(code, password, options){
      var json = { password: password};
      var request = AV._request("resetPasswordBySmsCode", null, code, "PUT",
                                json);
      return request._thenRunCallbacks(options);
    },

    /**
     * Makes a call to verify sms code that sent by AV.User.Cloud.requestSmsCode
     * If verify successfully,the user mobilePhoneVerified attribute will be true.
     * @param {String} code The sms code sent by AV.User.Cloud.requestSmsCode
     * @param {Object} options A Backbone-style options object
     * @return {AV.Promise} A promise that will be resolved with the result
     * of the function.
     */
    verifyMobilePhone: function(code, options){
      var request = AV._request("verifyMobilePhone", null, code, "POST",
                                null);
      return request._thenRunCallbacks(options);
    },

    /**
     * Requests a logIn sms code to be sent to the specified mobile phone
     * number associated with the user account. This sms code allows the user to
     * login by AV.User.logInWithMobilePhoneSmsCode function.
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {String} mobilePhone The mobile phone number  associated with the
     *           user that want to login by AV.User.logInWithMobilePhoneSmsCode
     * @param {Object} options A Backbone-style options object.
     */
    requestLoginSmsCode: function(mobilePhone, options){
      var json = { mobilePhoneNumber: mobilePhone };
      var request = AV._request("requestLoginSmsCode", null, null, "POST",
                                   json);
      return request._thenRunCallbacks(options);
    },

    /**
     * Retrieves the currently logged in AVUser with a valid session,
     * either from memory or localStorage, if necessary.
     * @return {AV.Object} The currently logged in AV.User.
     */
    current: function() {
      if (AV.User._currentUser) {
        return AV.User._currentUser;
      }

      if (AV.User._currentUserMatchesDisk) {

        return AV.User._currentUser;
      }

      // Load the user from local storage.
      AV.User._currentUserMatchesDisk = true;

      var userData = AV.localStorage.getItem(AV._getAVPath(
          AV.User._CURRENT_USER_KEY));
      if (!userData) {

        return null;
      }
      AV.User._currentUser = AV.Object._create("_User");
      AV.User._currentUser._isCurrentUser = true;

      var json = JSON.parse(userData);
      AV.User._currentUser.id = json._id;
      delete json._id;
      AV.User._currentUser._sessionToken = json._sessionToken;
      delete json._sessionToken;
      AV.User._currentUser._finishFetch(json);
      //AV.User._currentUser.set(json);

      AV.User._currentUser._synchronizeAllAuthData();
      AV.User._currentUser._refreshCache();
      AV.User._currentUser._opSetQueue = [{}];
      return AV.User._currentUser;
    },

    /**
     * Persists a user as currentUser to localStorage, and into the singleton.
     */
    _saveCurrentUser: function(user) {
      if (AV.User._currentUser !== user) {
        AV.User.logOut();
      }
      user._isCurrentUser = true;
      AV.User._currentUser = user;
      AV.User._currentUserMatchesDisk = true;

      var json = user.toJSON();
      json._id = user.id;
      json._sessionToken = user._sessionToken;
      AV.localStorage.setItem(
          AV._getAVPath(AV.User._CURRENT_USER_KEY),
          JSON.stringify(json));
    },

    _registerAuthenticationProvider: function(provider) {
      AV.User._authProviders[provider.getAuthType()] = provider;
      // Synchronize the current user with the auth provider.
      if (AV.User.current()) {
        AV.User.current()._synchronizeAuthData(provider.getAuthType());
      }
    },

    _logInWith: function(provider, options) {
      var user = AV.Object._create("_User");
      return user._linkWith(provider, options);
    }

  });
};

},{"underscore":28}],24:[function(require,module,exports){
(function (process){
'use strict';

var _ = require('underscore');

/*global _: false, $: false, localStorage: false, process: true,
  XMLHttpRequest: false, XDomainRequest: false, exports: false,
  require: false */
module.exports = function(AV) {
  /**
   * Contains all AV API classes and functions.
   * @name AV
   * @namespace
   *
   * Contains all AV API classes and functions.
   */

  // If jQuery or Zepto has been included, grab a reference to it.
  if (typeof($) !== "undefined") {
    AV.$ = $;
  }

  // Helpers
  // -------

  // Shared empty constructor function to aid in prototype-chain creation.
  var EmptyConstructor = function() {};


  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var inherits = function(parent, protoProps, staticProps) {
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && protoProps.hasOwnProperty('constructor')) {
      child = protoProps.constructor;
    } else {
      /** @ignore */
      child = function(){ parent.apply(this, arguments); };
    }

    // Inherit class (static) properties from parent.
    AV._.extend(child, parent);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    EmptyConstructor.prototype = parent.prototype;
    child.prototype = new EmptyConstructor();

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) {
      AV._.extend(child.prototype, protoProps);
    }

    // Add static properties to the constructor function, if supplied.
    if (staticProps) {
      AV._.extend(child, staticProps);
    }

    // Correctly set child's `prototype.constructor`.
    child.prototype.constructor = child;

    // Set a convenience property in case the parent's prototype is
    // needed later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Set the server for AV to talk to.
  AV.serverURL = "https://api.leancloud.cn";

  // Check whether we are running in Node.js.
  if (typeof(process) !== "undefined" &&
      process.versions &&
      process.versions.node) {
    AV._isNode = true;
  }

  /**
   * Call this method first to set up your authentication tokens for AV.
   * You can get your keys from the Data Browser on avoscloud.com.
   * @param {String} applicationId Your AV Application ID.
   * @param {String} applicationKey Your AV JavaScript Key.
   * @param {String} masterKey (optional) Your AVOSCloud Master Key. (Node.js only!).
   */
  AV.initialize = function(applicationId, applicationKey, masterKey) {
    if (masterKey) {
      throw new Error("AV.initialize() was passed a Master Key, which is only " +
        "allowed from within Node.js.");
    }
    AV._initialize(applicationId, applicationKey,masterKey);
  };

  /**
   * Call this method first to set up authentication tokens for AV.
   * This method is for AV's own private use.
   * @param {String} applicationId Your AV Application ID.
   * @param {String} applicationKey Your AV Application Key
   */
   AV._initialize = function(applicationId, applicationKey, masterKey) {
    if (AV.applicationId !== undefined &&
        applicationId !== AV.applicationId  &&
        applicationKey !== AV.applicationKey &&
        masterKey !== AV.masterKey) {
      console.warn('AVOSCloud SDK is already initialized, please don\'t reinitialize it.');
    }
    AV.applicationId = applicationId;
    AV.applicationKey = applicationKey;
    AV.masterKey = masterKey;
    AV._useMasterKey = false;
  };


  /**
   * Call this method to set production environment variable.
   * @param {Boolean} production True is production environment,and
   *  it's true by default.
   */
  AV.setProduction = function(production){
    if(!AV._isNullOrUndefined(production)) {
      //make sure it's a number
      production = production ? 1 : 0;
    }
    //default is 1
    AV.applicationProduction = AV._isNullOrUndefined(production) ? 1: production;
  };

  // If we're running in node.js, allow using the master key.
  if (AV._isNode) {
    AV.initialize = AV._initialize;

    AV.Cloud = AV.Cloud || {};
    /**
     * Switches the AVOSCloud SDK to using the Master key.  The Master key grants
     * priveleged access to the data in AVOSCloud and can be used to bypass ACLs and
     * other restrictions that are applied to the client SDKs.
     * <p><strong><em>Available in Cloud Code and Node.js only.</em></strong>
     * </p>
     */
    AV.Cloud.useMasterKey = function() {
      AV._useMasterKey = true;
    };
  }


   /**
    *Use china avoscloud API service:https://cn.avoscloud.com
    */
   AV.useAVCloudCN = function(){
    AV.serverURL = "https://leancloud.cn";
   };

   /**
    *Use USA avoscloud API service:https://us.avoscloud.com
    */
   AV.useAVCloudUS = function(){
    AV.serverURL = "https://us-api.leancloud.cn";
   };

  /**
   * Returns prefix for localStorage keys used by this instance of AV.
   * @param {String} path The relative suffix to append to it.
   *     null or undefined is treated as the empty string.
   * @return {String} The full key name.
   */
  AV._getAVPath = function(path) {
    if (!AV.applicationId) {
      throw "You need to call AV.initialize before using AV.";
    }
    if (!path) {
      path = "";
    }
    if (!AV._.isString(path)) {
      throw "Tried to get a localStorage path that wasn't a String.";
    }
    if (path[0] === "/") {
      path = path.substring(1);
    }
    return "AV/" + AV.applicationId + "/" + path;
  };

  /**
   * Returns the unique string for this app on this machine.
   * Gets reset when localStorage is cleared.
   */
  AV._installationId = null;
  AV._getInstallationId = function() {
    // See if it's cached in RAM.
    if (AV._installationId) {
      return AV._installationId;
    }

    // Try to get it from localStorage.
    var path = AV._getAVPath("installationId");
    AV._installationId = AV.localStorage.getItem(path);

    if (!AV._installationId || AV._installationId === "") {
      // It wasn't in localStorage, so create a new one.
      var hexOctet = function() {
        return Math.floor((1+Math.random())*0x10000).toString(16).substring(1);
      };
      AV._installationId = (
        hexOctet() + hexOctet() + "-" +
        hexOctet() + "-" +
        hexOctet() + "-" +
        hexOctet() + "-" +
        hexOctet() + hexOctet() + hexOctet());
      AV.localStorage.setItem(path, AV._installationId);
    }

    return AV._installationId;
  };

  AV._parseDate = function(iso8601) {
    var regexp = new RegExp(
      "^([0-9]{1,4})-([0-9]{1,2})-([0-9]{1,2})" + "T" +
      "([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})" +
      "(.([0-9]+))?" + "Z$");
    var match = regexp.exec(iso8601);
    if (!match) {
      return null;
    }

    var year = match[1] || 0;
    var month = (match[2] || 1) - 1;
    var day = match[3] || 0;
    var hour = match[4] || 0;
    var minute = match[5] || 0;
    var second = match[6] || 0;
    var milli = match[8] || 0;

    return new Date(Date.UTC(year, month, day, hour, minute, second, milli));
  };

  AV._ajaxIE8 = function(method, url, data) {
    var promise = new AV.Promise();
    var xdr = new XDomainRequest();
    xdr.onload = function() {
      var response;
      try {
        response = JSON.parse(xdr.responseText);
      } catch (e) {
        promise.reject(e);
      }
      if (response) {
        promise.resolve(response);
      }
    };
    xdr.onerror = xdr.ontimeout = function() {
      // Let's fake a real error message.
      var fakeResponse = {
        responseText: JSON.stringify({
          code: AV.Error.X_DOMAIN_REQUEST,
          error: "IE's XDomainRequest does not supply error info."
        })
      };
      promise.reject(xdr);
    };
    xdr.onprogress = function() {};
    xdr.open(method, url);
    xdr.send(data);
    return promise;
  };

   AV._useXDomainRequest = function() {
       if (typeof(XDomainRequest) !== "undefined") {
           // We're in IE 8+.
           if ('withCredentials' in new XMLHttpRequest()) {
               // We're in IE 10+.
               return false;
           }
           return true;
       }
       return false;
   };

  AV._ajax = function(method, url, data, success, error) {
    var options = {
      success: success,
      error: error
    };

    if (AV._useXDomainRequest()) {
      return AV._ajaxIE8(method, url, data)._thenRunCallbacks(options);
    }

    var promise = new AV.Promise();
    var handled = false;

    var xhr = new AV.XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (handled) {
          return;
        }
        handled = true;

        if (xhr.status >= 200 && xhr.status < 300) {
          var response;
          try {
            response = JSON.parse(xhr.responseText);
          } catch (e) {
            promise.reject(e);
          }
          if (response) {
            promise.resolve(response, xhr.status, xhr);
          }
        } else {
          promise.reject(xhr);
        }
      }
    };
    xhr.open(method, url, true);
    xhr.setRequestHeader("Content-Type", "text/plain");  // avoid pre-flight.
    if (AV._isNode) {
      // Add a special user agent just for request from node.js.
      xhr.setRequestHeader("User-Agent",
                           "AV/" + AV.VERSION +
                           " (NodeJS " + process.versions.node + ")");
    }
    xhr.send(data);
    return promise._thenRunCallbacks(options);
  };

  // A self-propagating extend function.
  AV._extend = function(protoProps, classProps) {
    var child = inherits(this, protoProps, classProps);
    child.extend = this.extend;
    return child;
  };

  /**
   * route is classes, users, login, etc.
   * objectId is null if there is no associated objectId.
   * method is the http method for the REST API.
   * dataObject is the payload as an object, or null if there is none.
   * @ignore
   */
  AV._request = function(route, className, objectId, method, dataObject) {
    if (!AV.applicationId) {
      throw "You must specify your applicationId using AV.initialize";
    }

    if (!AV.applicationKey && !AV.masterKey) {
      throw "You must specify a key using AV.initialize";
    }


    if (route !== "batch" &&
        route !== "classes" &&
        route !== "files" &&
        route !== "date" &&
        route !== "functions" &&
        route !== "login" &&
        route !== "push" &&
        route !== "search/select" &&
        route !== "requestPasswordReset" &&
        route !== "requestEmailVerify" &&
        route !== "requestPasswordResetBySmsCode" &&
        route !== "resetPasswordBySmsCode" &&
        route !== "requestMobilePhoneVerify" &&
        route !== "requestLoginSmsCode" &&
        route !== "verifyMobilePhone" &&
        route !== "requestSmsCode" &&
        route !== "verifySmsCode" &&
        route !== "users" &&
        route !== "usersByMobilePhone" &&
        route !== "cloudQuery" &&
        route !== "qiniu" &&
        route !== "statuses" &&
        route !== "bigquery" &&
        route !== 'search/select' &&
        route !== 'subscribe/statuses/count' &&
        route !== 'subscribe/statuses' &&
        !(/users\/[^\/]+\/updatePassword/.test(route)) &&
        !(/users\/[^\/]+\/friendship\/[^\/]+/.test(route))) {
      throw "Bad route: '" + route + "'.";
    }

    var url = AV.serverURL;
    if (url.charAt(url.length - 1) !== "/") {
      url += "/";
    }
    url += "1.1/" + route;
    if (className) {
      url += "/" + className;
    }
    if (objectId) {
      url += "/" + objectId;
    }
    if ((route ==='users' || route === 'classes') && dataObject && dataObject._fetchWhenSave){
      delete dataObject._fetchWhenSave;
      url += '?new=true';
    }

    dataObject = AV._.clone(dataObject || {});
    if (method !== "POST") {
      dataObject._method = method;
      method = "POST";
    }

    dataObject._ApplicationId = AV.applicationId;
    dataObject._ApplicationKey = AV.applicationKey;
    if(!AV._isNullOrUndefined(AV.applicationProduction)) {
      dataObject._ApplicationProduction = AV.applicationProduction;
    }
    if(AV._useMasterKey)
        dataObject._MasterKey = AV.masterKey;
    dataObject._ClientVersion = AV.VERSION;
    dataObject._InstallationId = AV._getInstallationId();
    // Pass the session token on every request.
    var currentUser = AV.User.current();
    if (currentUser && currentUser._sessionToken) {
      dataObject._SessionToken = currentUser._sessionToken;
    }
    var data = JSON.stringify(dataObject);

    return AV._ajax(method, url, data).then(null, function(response) {
      // Transform the error into an instance of AV.Error by trying to parse
      // the error string as JSON.
      var error;
      if (response && response.responseText) {
        try {
          var errorJSON = JSON.parse(response.responseText);
          if (errorJSON) {
            error = new AV.Error(errorJSON.code, errorJSON.error);
          }
        } catch (e) {
          // If we fail to parse the error text, that's okay.
        }
      }
      error = error || new AV.Error(-1, response.responseText);
      // By explicitly returning a rejected Promise, this will work with
      // either jQuery or Promises/A semantics.
      return AV.Promise.error(error);
    });
  };

  // Helper function to get a value from a Backbone object as a property
  // or as a function.
  AV._getValue = function(object, prop) {
    if (!(object && object[prop])) {
      return null;
    }
    return AV._.isFunction(object[prop]) ? object[prop]() : object[prop];
  };

  /**
   * Converts a value in a AV Object into the appropriate representation.
   * This is the JS equivalent of Java's AV.maybeReferenceAndEncode(Object)
   * if seenObjects is falsey. Otherwise any AV.Objects not in
   * seenObjects will be fully embedded rather than encoded
   * as a pointer.  This array will be used to prevent going into an infinite
   * loop because we have circular references.  If <seenObjects>
   * is set, then none of the AV Objects that are serialized can be dirty.
   */
  AV._encode = function(value, seenObjects, disallowObjects) {
    var _ = AV._;
    if (value instanceof AV.Object) {
      if (disallowObjects) {
        throw "AV.Objects not allowed here";
      }
      if (!seenObjects || _.include(seenObjects, value) || !value._hasData) {
        return value._toPointer();
      }
      if (!value.dirty()) {
        seenObjects = seenObjects.concat(value);
        return AV._encode(value._toFullJSON(seenObjects),
                             seenObjects,
                             disallowObjects);
      }
      throw "Tried to save an object with a pointer to a new, unsaved object.";
    }
    if (value instanceof AV.ACL) {
      return value.toJSON();
    }
    if (_.isDate(value)) {
      return { "__type": "Date", "iso": value.toJSON() };
    }
    if (value instanceof AV.GeoPoint) {
      return value.toJSON();
    }
    if (_.isArray(value)) {
      return _.map(value, function(x) {
        return AV._encode(x, seenObjects, disallowObjects);
      });
    }
    if (_.isRegExp(value)) {
      return value.source;
    }
    if (value instanceof AV.Relation) {
      return value.toJSON();
    }
    if (value instanceof AV.Op) {
      return value.toJSON();
    }
    if (value instanceof AV.File) {
      if (!value.url() && !value.id) {
        throw "Tried to save an object containing an unsaved file.";
      }
      return {
        __type: "File",
        id:  value.id,
        name: value.name(),
        url: value.url()
      };
    }
    if (_.isObject(value)) {
      var output = {};
      AV._objectEach(value, function(v, k) {
        output[k] = AV._encode(v, seenObjects, disallowObjects);
      });
      return output;
    }
    return value;
  };

  /**
   * The inverse function of AV._encode.
   * TODO: make decode not mutate value.
   */
  AV._decode = function(key, value) {
    var _ = AV._;
    if (!_.isObject(value)) {
      return value;
    }
    if (_.isArray(value)) {
      AV._arrayEach(value, function(v, k) {
        value[k] = AV._decode(k, v);
      });
      return value;
    }
    if (value instanceof AV.Object) {
      return value;
    }
    if (value instanceof AV.File) {
      return value;
    }
    if (value instanceof AV.Op) {
      return value;
    }
    if (value.__op) {
      return AV.Op._decode(value);
    }
    if (value.__type === "Pointer") {
      var className = value.className;
      var pointer = AV.Object._create(className);
      if(value.createdAt){
          delete value.__type;
          delete value.className;
          pointer._finishFetch(value, true);
      }else{
          pointer._finishFetch({ objectId: value.objectId }, false);
      }
      return pointer;
    }
    if (value.__type === "Object") {
      // It's an Object included in a query result.
      var className = value.className;
      delete value.__type;
      delete value.className;
      var object = AV.Object._create(className);
      object._finishFetch(value, true);
      return object;
    }
    if (value.__type === "Date") {
      return AV._parseDate(value.iso);
    }
    if (value.__type === "GeoPoint") {
      return new AV.GeoPoint({
        latitude: value.latitude,
        longitude: value.longitude
      });
    }
    if (key === "ACL") {
      if (value instanceof AV.ACL) {
        return value;
      }
      return new AV.ACL(value);
    }
    if (value.__type === "Relation") {
      var relation = new AV.Relation(null, key);
      relation.targetClassName = value.className;
      return relation;
    }
    if (value.__type === "File") {
      var file = new AV.File(value.name);
      file._metaData = value.metaData || {};
      file._url = value.url;
      file.id = value.objectId;
      return file;
    }
    AV._objectEach(value, function(v, k) {
      value[k] = AV._decode(k, v);
    });
    return value;
  };

  AV._arrayEach = AV._.each;

  /**
   * Does a deep traversal of every item in object, calling func on every one.
   * @param {Object} object The object or array to traverse deeply.
   * @param {Function} func The function to call for every item. It will
   *     be passed the item as an argument. If it returns a truthy value, that
   *     value will replace the item in its parent container.
   * @returns {} the result of calling func on the top-level object itself.
   */
  AV._traverse = function(object, func, seen) {
    if (object instanceof AV.Object) {
      seen = seen || [];
      if (AV._.indexOf(seen, object) >= 0) {
        // We've already visited this object in this call.
        return;
      }
      seen.push(object);
      AV._traverse(object.attributes, func, seen);
      return func(object);
    }
    if (object instanceof AV.Relation || object instanceof AV.File) {
      // Nothing needs to be done, but we don't want to recurse into the
      // object's parent infinitely, so we catch this case.
      return func(object);
    }
    if (AV._.isArray(object)) {
      AV._.each(object, function(child, index) {
        var newChild = AV._traverse(child, func, seen);
        if (newChild) {
          object[index] = newChild;
        }
      });
      return func(object);
    }
    if (AV._.isObject(object)) {
      AV._each(object, function(child, key) {
        var newChild = AV._traverse(child, func, seen);
        if (newChild) {
          object[key] = newChild;
        }
      });
      return func(object);
    }
    return func(object);
  };

  /**
   * This is like _.each, except:
   * * it doesn't work for so-called array-like objects,
   * * it does work for dictionaries with a "length" attribute.
   */
  AV._objectEach = AV._each = function(obj, callback) {
    var _ = AV._;
    if (_.isObject(obj)) {
      _.each(_.keys(obj), function(key) {
        callback(obj[key], key);
      });
    } else {
      _.each(obj, callback);
    }
  };

  // Helper function to check null or undefined.
  AV._isNullOrUndefined = function(x) {
    return AV._.isNull(x) || AV._.isUndefined(x);
  };
};

}).call(this,require('_process'))
},{"_process":27,"underscore":28}],25:[function(require,module,exports){
'use strict';

module.exports = "js0.6.1";

},{}],26:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":27}],27:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],28:[function(require,module,exports){
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}]},{},[2]);
