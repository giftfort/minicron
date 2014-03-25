'use strict';

(function() {
  function updateScheduleInput(value) {
    Ember.$('#schedule-input').find('input').val(value);
  }

  function handleUpdate(self, e, $this) {
    // Get the schedule
    var schedule = self.get('schedule');

    // The 'id' of the event which we use to defer the type
    // it's either the href with the # stripped off if it's a
    // tab click or the actual id attribute of the element
    var id;
    // If the href exists we can assume it's a tab
    if (typeof $this.attr('href') !== 'undefined') {
      id = $this.attr('href').substr(1);
    } else {
      id = $this.attr('id');

      // If it's a checkbox set the id to it's parents parent
      if ($this.attr('type') === 'checkbox') {
        id = $this.closest('.tab-pane').attr('id');
      }

      // If it's a every-n-value then strip off the -value
      else if (id.substr(-6) === '-value') {
        id = id.substr(0, id.length - 6);
      }
    }

    // Define the types of schedules we are searching for
    var every_n = ['every-minute', 'every-hour', 'every-day-of-the-month', 'every-month', 'every-day-of-the-week'];
    var every_n_type = ['every-n-minutes', 'every-n-hours'];

    // Define the key/value vars used when the change to the schedule is set
    var key, value = '';

    // Is it an 'every n' i.e *
    if (every_n.indexOf(id) >= 0) {
      // Transform the id into a key for the schedule, replace - with _
      key = id.substr(6).split('-').join('_');
      value = '*';
    }

    // Is it any 'every n type' i.e */n
    else if (every_n_type.indexOf(id) >= 0) {
      // Transform the id into a key for the schedule, replace - with _ and strip the trailing s
      key = id.substr(8, (id.length - 1) - 8).split('-').join('_');

      // Set the value using the value of the input
      value = '*/' + Ember.$('#' + id + '-value').val();
    }

    // Otherwise we can assume it's a each selected type
    else {
      // Transform the id into a key for the schedule, removing the every-selected-
      // and replace- with _
      key = id.substr(14).split('-').join('_');

      // Loop every checkbox
      Ember.$('#' + id).find('input[type="checkbox"]').each(function(k, v) {
        // If the checkbox is checked add the value
        if (v.checked === true) {
          value += Ember.$(this).parent().text() + ',';
        }
      });

      // If no value has been set i.e no checkboxes are ticked, default to *
      if (value.length === 0) {
        value = '*';
      // Otherwise we need to remove the trailing ,
      } else {
        if (value.substr(-1) === ',') {
          value = value.substr(0, value.length - 1);
        }
      }
    }

    // Update the schedule
    console.log('setting', key, value);
    schedule.set(key, value);

    // Update the schedule input text box
    updateScheduleInput(schedule.get('formatted'));
  }

  Minicron.ScheduleEditorComponent = Ember.Component.extend({
    didInsertElement: function() {
      this.store = this.get('targetObject.store');
      var self = this;

      // Do we already have the schedule id? i.e we are editing a schedule
      if (this.get('schedule_id')) {
        // Look up the schedule
        this.store.find('schedule', this.get('schedule_id')).then(function(schedule) {
          self.set('schedule', schedule);

          // Set the formatted schedule in the schedule input textbox
          updateScheduleInput(self.get('schedule.formatted'));
        });
      // If not we must be adding a new schedule
      } else {
        // Create a default schedule record
        this.set('schedule', this.store.createRecord('schedule', {
          minute: '*',
          hour: '*',
          day_of_the_month: '*',
          month: '*',
          day_of_the_week: '*'
        }));

        // Set the formatted schedule in the schedule input textbox
        updateScheduleInput(this.get('schedule.formatted'));
      }

      self = this;

      // Handle when one of the tabs is clicked
      this.$('#schedule-editor').find('a[data-toggle="tab"]').on('click', function(e) {
        handleUpdate(self, e, Ember.$(this));
      });

      // Handle when one of the checkboxes for 'each selected x' or 'every n x' is changed
      this.$('#schedule-editor').find('input[type="checkbox"], input[type="number"]').on('change', function(e) {
        handleUpdate(self, e, Ember.$(this));
      });
    },
    actions: {
      save: function() {
        this.sendAction('save', {
          job_id: this.get('job_id'),
          schedule: this.get('schedule')
        });
      },
      cancel: function(schedule) {
        this.sendAction('cancel', schedule);
      }
    }
  });
})();