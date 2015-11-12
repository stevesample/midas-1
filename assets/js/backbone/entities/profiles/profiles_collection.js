var _ = require('underscore');
var Backbone = require('backbone');
var ProfileModel = require('./profile_model');


var ProfilesCollection = Backbone.Collection.extend({

  model: ProfileModel,

  url: '/api/user/all',

});

module.exports = ProfilesCollection;
