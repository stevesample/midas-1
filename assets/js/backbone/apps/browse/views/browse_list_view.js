var _ = require('underscore');
var Backbone = require('backbone');
var async = require('async');
var utils = require('../../../mixins/utilities');
var UIConfig = require('../../../config/ui.json');
var marked = require('marked');
var TagConfig = require('../../../config/tag');
var ProjectListItem = require('../templates/project_list_item.html');
var TaskListItem = require('../templates/task_list_item.html');
var NoListItem = require('../templates/no_search_results.html');


var BrowseListView = Backbone.View.extend({

  initialize: function (options) {
    var self = this;

    var pageSize = 27;
    if (UIConfig.browse && UIConfig.browse.pageSize)
      pageSize = UIConfig.browse.pageSize;

    this.options = options;
    this.data = {
      pageSize: pageSize,
      page: 1
    };
    $(window).on('scroll',function(e){
      self.scrollCheck(e);
    });
  },

  organizeTags: function (tags) {
    // put the tags into their types
    return _(tags).groupBy('type');
  },

  scrollCheck: function(e) {
    var currentScrollPos = $(window).scrollTop();
    var currentMaxHeight = $('#container').height();
    var buffer           = 600;

    if ( (this.options.collection.length / this.data.page) > 1 && Math.ceil(this.options.collection.length / this.data.pageSize) >= this.data.page && currentScrollPos + buffer > currentMaxHeight ){
      this.data.page += 1;
      this.render();
    }
  },

  render: function () {
    var start, limit;

    //settings for infinite scroll
    if ( UIConfig.browse && UIConfig.browse.useInfiniteScroll ) {
      if ( this.data.page == 1 ){
        start = 0;
      } else {
        start = (this.data.page-1) * this.data.pageSize;
      }
      limit = start + this.data.pageSize;
    } else {
      //reset page to 1 and return
      if ( this.data.page > 1 ) {
        this.data.page = 1;
        return this;
      }
      limit = this.options.collection.length;
      start = 0;
    }

    if ( this.options.collection.length === 0 ){
      var settings = {
        ui: UIConfig
      };
      compiledTemplate = _.template(NoListItem)(settings);
      this.$el.append(compiledTemplate);
    } else {

      for (var i = start; i < limit; i++ ){

      if ( typeof this.options.collection[i] == 'undefined' ){ break; }
        var item = {
          item: this.options.collection[i],
          user: window.cache.currentUser,
          tagConfig: TagConfig,
          tagShow: ['location', 'skill', 'topic', 'task-time-estimate', 'task-time-required']
        };
        if (this.options.collection[i].tags) {
          item.tags = this.organizeTags(this.options.collection[i].tags);
        } else {
          item.tags =[];
        }
        if (this.options.collection[i].description) {
          item.item.descriptionHtml = marked(this.options.collection[i].description);
        }
        var compiledTemplate = '';
        if (this.options.target == 'projects') {
          compiledTemplate = _.template(ProjectListItem)(item);
        } else {
          compiledTemplate = _.template(TaskListItem)(item);
        }
        this.$el.append(compiledTemplate);
      }
    }
    this.$el.i18n();
    return this;
  },

  cleanup: function () {
    removeView(this);
  }

});

module.exports = BrowseListView;
