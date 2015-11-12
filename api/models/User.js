/**
 * User
 *
 * @module      :: Model
 * @description :: User representation
 *
 */

var exportUtils = require('../services/utils/export');

module.exports = {
  schema: true,
  tableName: 'midas_user',
  attributes: {
    // Login information
    username: { type: 'email', unique: true },
    passports : { collection: 'Passport', via: 'user' },

    // Core attributes about a user
    name: 'STRING',

    // Professional Title
    title: 'STRING',

    // Biography
    bio: 'STRING',

    // User's profile photo
    // If photoId is not null, the URL to the file is /file/get/:id
    photoId: 'INTEGER',
    // If photoUrl is not null, then an external provider gave us the photo
    // Use the URL directly as the resource identifier for the photo.
    photoUrl: 'STRING',

    // User metadata for service delivery
    isAdmin: {
      type: 'BOOLEAN',
      defaultsTo: false
    },

    // is the user's login disabled
    disabled: {
      type: 'BOOLEAN',
      defaultsTo: false
    },

    // Store the number of invalid password attempts
    passwordAttempts: {
      type: 'INTEGER',
      defaultsTo: 0
    },

    // Tag association
    tags: {
      collection: 'tagEntity',
      via: 'users',
      dominant: true
    },

    toJSON: function() {
      var obj = this.toObject();
      delete obj.passports;
      return obj;
    }
  },

  // TODO: add more fields, likely driven off subqueries
  exportFormat: {
    'user_id': 'id',
    'name': {field: 'name', filter: exportUtils.nullToEmptyString},
    'username': {field: 'username', filter: exportUtils.nullToEmptyString},
    'title': {field: 'title', filter: exportUtils.nullToEmptyString},

    // The two below fields are not directly on the user model
    // They are populated from tags by UserController.export
    'agency': {field: 'agency', filter: exportUtils.nullToEmptyString},
    'location': {field: 'location', filter: exportUtils.nullToEmptyString},

    'bio': {field: 'bio', filter: exportUtils.nullToEmptyString},
    'admin': 'isAdmin',
    'disabled': 'disabled'
  },

  beforeValidate: function(values, done) {
    values.username = values.username.toLowerCase();
    done();
  },

  beforeCreate: function(values, done) {
    // If configured, validate that user has an email from a valid domain
    if (sails.config.validateDomains && sails.config.domains) {
      var domains = sails.config.domains.map(function(domain) {
            return new RegExp(domain.replace(/\./g, '\.') + '$');
          });
      if (!_.find(domains, function(domain) {
        return domain.test(values.username.split('@')[1]);
      })) return done('invalid domain');
    }
    done();
  },

  afterCreate: function(model, done) {
    Notification.create({
      action: 'user.create.welcome',
      model: model
    }, done);
  }

};
