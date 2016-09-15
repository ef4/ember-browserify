import Ember from 'ember';

// Should be version 1970.0.0
import flooring from 'npm:flooring';

// Should be 1970.0.0, which the host app includes
import modernApp from '../utils/floor-modern';
import outdatedApp from '../utils/floor-outdated';

// Should be version 1970.0.0
import outdated from 'outdated/utils/floor-type';

// Should be version 2010.0.0
import modern from 'modern/utils/floor-type';

export default Ember.Route.extend({
  model() {
    return flooring();
  },

  modern() {
    return modern();
  },

  modernApp() {
    return modernApp();
  },

  outdated() {
    return outdated();
  },

  outdatedApp() {
    return outdatedApp();
  }
});
