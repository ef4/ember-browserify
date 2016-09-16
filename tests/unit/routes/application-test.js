import { moduleFor, test } from 'ember-qunit';

moduleFor('route:application', 'Unit | Route | application', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
});

test('it properly resolves npm modules', function(assert) {
  let route = this.subject();

  // Host application which depends on flooring@2030.0.0
  // Set by virtue of folder structure.
  assert.equal(route.flooring(), 'space cloud');

  // Moved into the app folder via the addons.
  assert.equal(route.modernApp(), 'space cloud');
  assert.equal(route.outdatedApp(), 'space cloud');

  // Addon which depends on flooring@1970.0.0
  assert.equal(route.outdated(), 'shag carpet');
  assert.equal(route.outdatedReexports(), 'shag carpet');

  // Addon which depends on flooring@2010.0.0
  assert.equal(route.modern(), 'hardwood');
  assert.equal(route.modernReexports(), 'hardwood');
});
