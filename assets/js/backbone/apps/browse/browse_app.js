var _ = require('underscore');
var Backbone = require('backbone');
var utils = require('../../mixins/utilities');
var NavView = require('../nav/views/nav_view');
var FooterView = require('../footer/views/footer_view');
var BrowseListController = require('./controllers/browse_list_controller');
var ProjectModel = require('../../entities/projects/project_model');
var ProjectShowController = require('../project/show/controllers/project_show_controller');
var ProfileShowController = require('../profiles/show/controllers/profile_show_controller');
var TaskModel = require('../../entities/tasks/task_model');
var TaskCollection = require('../../entities/tasks/tasks_collection');
var TaskShowController = require('../tasks/show/controllers/task_show_controller');
var TaskEditFormView = require('../tasks/edit/views/task_edit_form_view');
var TaskCreateFormView = require('../tasks/new/views/task_form_view');
var AdminMainController = require('../admin/controllers/admin_main_controller');
var HomeController = require('../home/controllers/home_controller');


var BrowseRouter = Backbone.Router.extend({

  routes: {
    ''                          : 'showHome',
    'dashboard(/)'              : 'showHome',
    'projects(/)(?:queryStr)'   : 'listProjects',
    'projects/:id(/)'           : 'showProject',
    'projects/:id/:action(/)'   : 'showProject',
    'tasks/new'                 : 'newTask',
    'tasks(/)(?:queryStr)'      : 'listTasks',
    'tasks/:id(/)'              : 'showTask',
    'tasks/:id/:action(/)'      : 'showTask',
    'profiles(/)(?:queryStr)'   : 'listProfiles',
    'profile(/)'                : 'showProfile',
    'profile/:id(/)'            : 'showProfile',
    'profile/:id(/)/:action'    : 'showProfile',
    'admin(/)'                  : 'showAdmin',
    'admin(/):action(/)'        : 'showAdmin'
  },

  data: { saved: false },

  initialize: function () {
    this.navView = new NavView({
      el: '.navigation'
    }).render();
    this.footerView = new FooterView({
      el: '#footer'
    }).render();

    // set navigation state
    this.on('route', function(route, params) {
      var href = window.location.pathname;
      $('.navigation .nav-link')
        .closest('li')
        .removeClass('active');
      $('.navigation .nav-link[href="' + href + '"]')
        .closest('li')
        .addClass("active");
    });
  },

  cleanupChildren: function () {
    if (this.browseListController) { this.browseListController.cleanup(); }
    if (this.projectShowController) { this.projectShowController.cleanup(); }
    if (this.profileShowController) { this.profileShowController.cleanup(); }
    if (this.taskShowController) { this.taskShowController.cleanup(); }
    if (this.taskCreateController) { this.taskCreateController.cleanup(); }
    if (this.homeController) { this.homeController.cleanup(); }
    this.data = { saved: false };
  },

  showHome: function () {
    this.cleanupChildren();
    this.homeController = new HomeController({
      target: 'home',
      el: '#container',
      router: this,
      data: this.data
    });
  },

  parseQueryParams: function (str) {
    var params = {};
    if (str) {
      var terms = str.split('&');
      for (var i = 0; i < terms.length; i++) {
        var nameValue = terms[i].split('=');
        if (nameValue.length == 2) {
          params[nameValue[0]] = nameValue[1];
        } else {
          params[terms[i]] = '';
        }
      }
    }
    return params;
  },

  listProjects: function (queryStr) {
    this.cleanupChildren();
    this.browseListController = new BrowseListController({
      target: 'projects',
      el: '#container',
      router: this,
      queryParams: this.parseQueryParams(queryStr),
      data: this.data
    });
  },

  listTasks: function (queryStr) {
    this.cleanupChildren();
    this.browseListController = new BrowseListController({
      target: 'tasks',
      el: '#container',
      router: this,
      queryParams: this.parseQueryParams(queryStr),
      data: this.data
    });
  },

  listProfiles: function (queryStr) {
    this.cleanupChildren();
    this.browseListController = new BrowseListController({
      target: 'profiles',
      el: '#container',
      router: this,
      queryParams: this.parseQueryParams(queryStr),
      data: this.data
    });
  },

  showProject: function (id, action) {
    this.cleanupChildren();
    var model = new ProjectModel();
    model.set({ id: id });
    this.projectShowController = new ProjectShowController({ model: model, router: this, id: id, action: action, data: this.data });
  },

  showTask: function (id, action) {
    this.cleanupChildren();
    var model = new TaskModel();
    model.set({ id: id });
    this.taskShowController = new TaskShowController({ model: model, router: this, id: id, action: action, data: this.data });
  },

  newTask: function() {
    this.cleanupChildren();
    var tasks = new TaskCollection();
    this.taskCreateController = new TaskCreateFormView({ collection: tasks });
    this.taskCreateController.render();

    this.listenTo(tasks, 'task:save:success', function(data) {
      Backbone.history.navigate('/tasks/' + data, { trigger: true });
    });
    this.listenTo(tasks, 'task:save:error', function(model, response, options) {
      var alertText = response.statusText + '. Please try again.';
      $('.alert.alert-danger').text(alertText).show();
      window.scroll(0,0);
    });
  },

  showProfile: function (id, action) {
    this.cleanupChildren();
    // normalize input
    if (id) {
      id = id.toLowerCase();
    }
    if (action) {
      action = action.toLowerCase();
    }
    // normalize actions that don't have ids
    if (!action && id) {
      if (id == 'edit') {
        action = id;
        id = window.cache.currentUser.id;
      }
      else if (id == 'settings') {
        action = id;
        id = window.cache.currentUser.id;
      }
    }
    this.profileShowController = new ProfileShowController({ id: id, action: action, data: this.data });
  },

  showAdmin: function (action) {
    this.cleanupChildren();
    this.adminMainController = new AdminMainController({
      el: "#container",
      action: action
    });
  }

});

var initialize = function () {
  var router = new BrowseRouter();
  return router;
};

module.exports = {
  initialize: initialize
};
