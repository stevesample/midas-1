var _ = require('underscore');
var Backbone = require('backbone');

'use strict';

var TaskModel = Backbone.Model.extend({

  defaults: {
    name        : null,
    description : null
  },

  urlRoot: '/api/task',

  initialize: function () {
    this.listenTo(this, "task:save", function (data) {
      this.save(data);
    });

    this.listenTo(this, "task:model:fetch", function (data) {
      this.remoteGet(data);
    });

    this.listenTo(this, "task:update", function (data) {
      this.update(data);
    });

    this.listenTo(this, "task:update:state", function (state) {
      this.updateState(state);
    });

    this.listenTo(this, "task:update:orphan", function (data) {
      this.orphan(data);
    });
  },

  update: function (data) {
    var self = this;
    this.save(data, {
      success: function (data) {
        self.trigger("task:update:success", data);
      }
    });
  },

  updateState: function (state) {
    var self = this;

    this.save({
      state: state
    }, {
      success: function(data) {
        self.trigger("task:update:state:success", data);
      }
    });
  },

  orphan: function(data) {
    var self = this;

    this.save({
      projectId: null
    }, {
      success: function(data) {
        self.trigger("task:update:orphan:success", data);
      }
    });

  },

  remoteGet: function (id) {
    var self = this;
    this.set({ id: id });
    this.fetch({
      success: function (data) {
        self.trigger("task:model:fetch:success", data);
      },
      error: function(data, xhr) {
        self.trigger("task:model:fetch:error", data, xhr);
      }
    });
  },

});

  module.exports = TaskModel;
