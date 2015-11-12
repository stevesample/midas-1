var _ = require('underscore');
var Backbone = require('backbone');
var utils = require('../../../../mixins/utilities');
var UIConfig = require('../../../../config/ui.json');
var async = require('async');
var ActTemplate = require('../templates/profile_activity_template.html');


var ProfileActivityView = Backbone.View.extend({

  events: {
    'click .activity-link'    : 'link'
  },

  initialize: function (options) {
    this.options = options;
  },

  render: function () {
    // sort initially by date, descending.
    var results = this.options.data
        .filter(function(i) {
          return i && i.createdAt;
        })
        .sort(function (a, b) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
    var data = {
      ui: UIConfig,
      target: this.options.target,
      targetFriendly: i18n.t(this.options.target),
      targetsFriendly: i18n.t(this.options.target + 'Plural'),
      targetCapitalized: this.options.target.charAt(0).toUpperCase() + this.options.target.slice(1),
      handle: this.options.handle,
      data: results,
      count: {}
    };

    for (var i in this.options.data) {
      if (_.isUndefined(data.count[this.options.data[i].state])) {
        data.count[this.options.data[i].state] = 1;
      } else {
        data.count[this.options.data[i].state]++;
      }
    }
    var template = _.template(ActTemplate)(data);
    this.$el.html(template);
    this.$el.i18n();

    return this;
  },

  link: function (e) {
    if (e.preventDefault) e.preventDefault();
    Backbone.history.navigate(this.options.target + 's/' + $(e.currentTarget).data('id'), { trigger: true });
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = ProfileActivityView;
