import Ember from 'ember';

// Should be version 2030.0.0
import flooring from 'npm:flooring';

// Should be 2030.0.0, which the host app includes
import modernApp from '../utils/floor-modern'; // source: tests/dummy/lib/modern/app/utils/floor-modern
import outdatedApp from '../utils/floor-outdated'; // source: tests/dummy/lib/outdated/app/utils/floor-outdated

// Should be version 1970.0.0
import outdated from 'outdated/utils/floor-type';
import outdatedReexports from '../utils/reexports-outdated'; // source: tests/dummy/lib/outdated/app/utils/reexports-outdated

// Should be version 2010.0.0
import modern from 'modern/utils/floor-type';
import modernReexports from '../utils/reexports-modern'; // source: tests/dummy/lib/modern/app/utils/reexports-modern

export default Ember.Route.extend({
  flooring,

  modernApp,
  outdatedApp,

  outdated,
  outdatedReexports,

  modern,
  modernReexports
});
