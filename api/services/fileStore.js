var AWS = require('aws-sdk'),
    fs = require('fs'),
    p = require('path'),
    config = sails.config.fileStore || {};

module.exports = {

  /**
   * Store a file
   * Takes a name, buffer of data, and callback function
   * Delegates to the service specified in `sails.config.upload`
   */
  store: function(name, data, cb) {
    var service = config.service || 'local';
    this[service].store.apply(this, arguments);
  },

  /**
   * Get a file
   * Takes a name of the file and a `res` object
   * Pipes the file directly to `res` or returns a 404 error
   * Delegates to the service specified in `sails.config.upload`
   */
  get: function(name, res) {
    var service = (config.service || 'local');
    this[service].get.apply(this, arguments);
  },

  // Local disk operations
  local: {
    store: function(name, data, cb) {
      var dir = config.local.dirname || '/assets/uploads',
          path = p.join(sails.config.appPath, dir, name);
      fs.writeFile(path, data, cb);
    },
    get: function(name, res) {
      var dir = config.local.dirname || '/assets/uploads',
          path = p.join(sails.config.appPath, dir, name);
      fs.createReadStream(path)
        .on('error', function() { res.send(404); }).pipe(res);
    }
  },

  // S3 operations
  s3: {
    store: function(name, data, cb) {
      var s3 = new AWS.S3(),
          params = {
            Bucket: config.s3.bucket,
            Key: p.join(config.s3.prefix || '', name),
            Body: data
          };
      s3.upload(params, cb);
    },
    get: function(name, res) {
      var s3 = new AWS.S3(),
          params = {
            Bucket: config.s3.bucket,
            Key: p.join(config.s3.prefix || '', name)
          };
      s3.getObject(params).createReadStream()
        .on('error', function(e) {
          sails.log.verbose('s3 get error:', e);
          res.send(404);
        }).pipe(res);

    }
  }
};
