var _ = require('underscore');
var Backbone = require('backbone');
var TaskModel = require('./task_model');

'use strict';

var TasksCollection = Backbone.Collection.extend({

  model: TaskModel,

  parse: function (response) {
    if (response) {
      if (response.tasks) {
        return response.tasks;
      }
      return response;
    }
    return [];
  },

  url: '/api/task',

  initialize: function () {
    var self = this;

    this.listenTo(this, "task:save", function (data) {
      self.addAndSave(data);
    });
  },

  addAndSave: function (data) {
    var self = this;

    self.task = new TaskModel(data);

    self.task.save(null,{
      success: function (model) {
        self.trigger("task:save:success", self.task.id);
      },
      error: function (model, response, options) {
        self.trigger("task:save:error", model, response, options);
      }
    });
  }

});

module.exports = TasksCollection;
