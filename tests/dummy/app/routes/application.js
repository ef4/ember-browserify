import Ember from 'ember';

// Should be version 1970.0.0
import flooring from 'npm:flooring';

export default Ember.Route.extend({
  model() {
    return flooring();
  }
});
