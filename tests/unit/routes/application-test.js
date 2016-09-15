import { moduleFor, test } from 'ember-qunit';

moduleFor('route:application', 'Unit | Route | application', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
});

test('it properly resolves npm modules', function(assert) {
  let route = this.subject();

  // Host application which depends on flooring@1970
  // Set by virtue of folder structure.
  assert.equal(route.model(), 'shag carpet');
  assert.equal(route.modernApp(), 'shag carpet');
  assert.equal(route.outdatedApp(), 'shag carpet');

  // Addon which depends on flooring@2010
  assert.equal(route.modern(), 'hardwood');

  // Addon which depends on flooring@1970
  assert.equal(route.outdated(), 'shag carpet');
});
