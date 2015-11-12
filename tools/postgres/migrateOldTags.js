var Sails = require('sails'),
    _ = require('underscore'),
    async = require('async');


var opts = {
  connections: {
    postgresql: { softDelete: false }
  }
};

Sails.lift(opts, function(err, sails) {
  if (err) return console.error(err);

  var tagsToRename = {
    'Part Time': 'One time',
    'Full Time': 'Ongoing',
    'On going': 'Ongoing',
    '1 week': 'Weekly',
    '1 Week': 'Weekly',
    '1 month': 'Monthly',
    '1 Month': 'Monthly',
    '1 - 3 hours': 'Up to 2 hours',
    '9 - 24 hours': '8 - 16 hours'
  };

  var newTagNamesToAdd = [
    { type: 'task-length', name: 'Biweekly' },
    { type: 'task-time-estimate', name: '2 - 4 hours' },
    { type: 'task-time-estimate', name: '16 - 24 hours' },
    { type: 'task-time-estimate', name: '24 - 40 hours' }
  ];

  var tagNamesToMigrate = {
    '20% Time': 'Ongoing',
    '1 Day': 'Weekly',
    '1 - 3 Days': 'Weekly',
    'A Few Months': 'Monthly',
    '3 months': 'Monthly',
    '6 months': 'Monthly',
    'longer than 40 hours': '24 - 40 hours',
    '25 - 40 hours': '24 - 40 hours'
  };

  var orderedTaskLengthTags = [
    'Weekly',
    'Biweekly',
    'Monthly'
  ];

  var orderedTaskTimeEstimateTags = [
    'Less than 1 hour',
    'Up to 2 hours',
    '2 - 4 hours',
    '4 - 8 hours',
    '8 - 16 hours',
    '16 - 24 hours',
    '24 - 40 hours'
  ];

  function renameTags (cb) {
    _.keys(tagsToRename).forEach(function(oldTag) {
      var newTag = tagsToRename[oldTag];

      TagEntity.findOne({name: oldTag})
      .exec(function (err, tagEntity) {
        if (err) return cb(err);
        if (!tagEntity) { return }

        tagEntity.name = newTag;
        tagEntity.save(function (err, newModel) {
          if (err) return cb(err);
          console.log('Renaming tags "' + oldTag + '" to "' + newTag + '"');
        });
      });
    });
    cb(null);
  }

  function addTags (cb) {
    _.each(newTagNamesToAdd, function (newTagName) {
      var type = newTagName.type;
      var name = newTagName.name;
      var newTag = { type: type, name: name };

      TagEntity.findOne({name: name})
      .exec(function(err, tagEntity) {
        if (err) return cb(err);
        if (tagEntity) { return }

        TagEntity.create(newTag).exec(function (err, newModel){
          if (err) { return cb(err); }
          console.log('Adding new tag "' + name + '" of type "' + type + '"');
        });
      });
    });
    cb(null);
  }

  function migrateTags (cb) {
    _.keys(tagNamesToMigrate).forEach(function (oldTag) {
      var newTag = tagNamesToMigrate[oldTag];

      TagEntity.findOne({ name: newTag })
      .exec(function (err, newTagEntity){
        if (err) { return cb(err); }
        if (!newTagEntity) { return; }
        // nested so that we have easy access to the new and old tags
        TagEntity.findOne({ name: oldTag })
        .populate('users').populate('tasks').populate('projects')
        .exec(function (err, oldTagEntity) {
          if (err) return cb(err);
          if (!oldTagEntity) { return }

          if (oldTagEntity.users.length != 0) {
            oldTagEntity.users.forEach(function (user) {
              migrateTagsOnModelAndDeleteOld(user, newTagEntity, oldTagEntity)
            });
          }

          if (oldTagEntity.tasks.length != 0) {
            oldTagEntity.tasks.forEach(function (task) {
              migrateTagsOnModelAndDeleteOld(task, newTagEntity, oldTagEntity)
            });
          }

          if (oldTagEntity.projects.length != 0) {
            oldTagEntity.projects.forEach(function (project) {
              migrateTagsOnModelAndDeleteOld(project, newTagEntity, oldTagEntity)
            });
          }

          TagEntity.destroy({id: oldTagEntity.id }).exec(function(err, t) {
            if (err) return cb(err);
            console.log('Deleting tag "' + oldTagEntity.name + '"')
          });

        });
      });
    });
    cb(null);
  }

  function migrateTagsOnModelAndDeleteOld (model, newTag, oldTag) {
    model.tags.add(newTag.id);
    model.tags.remove(oldTag.id);
    model.save(function (err) {
      if (err) return cb(err);
      TagEntity.destroy({ id: oldTag.id }).exec(function (err, d) {
        if (err) return cb(err);
        console.log('Migrating tags "' + oldTag.name + '" to "' + newTag.name + '"');
      });
    });
  }

  function orderTaskLength (cb) {
    console.log('Ensuring order of task-length tags');
    orderedTaskLengthTags.forEach(function(tag) {
      TagEntity.find().where({ name: tag }).exec(function (err, t) {
        if (err) return cb(err);
        if (!t.length) return cb();

        t[0].updatedAt = new Date();
        t[0].save();
      });
    });
    cb(null);
  }

  function orderTaskTimeEstimate (cb) {
    console.log('Ensuring order of task-time-estimate tags');
    orderedTaskTimeEstimateTags.forEach(function(tag) {
      TagEntity.find().where({ name: tag }).exec(function (err, t) {
        if (err) return cb(err);

        t[0].updatedAt = new Date();
        t[0].save();
      });
    });
    cb(null);
  }

  async.series([renameTags, addTags, migrateTags, orderTaskLength, orderTaskTimeEstimate], function (err, result) {
    if (err) return err;

    console.log('Migration done');
  })

});
