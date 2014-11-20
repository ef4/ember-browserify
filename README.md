# Ember-browserify

This is an ember-cli addon for easily loading CommonJS modules from
npm via browserify.

It depends on proposed changes to ember-cli and
broccoli-es6-concatenator, so don't expect it to work yet unless you
want to use my forks of both.

## Synopsis

Add to your ember app:

    npm install --save-dev ember-browserify

Then `npm install` any modules you want to load into your Ember app:

    npm install --save-dev my-cool-module

Then within your app, you can import the module:

    import MyCoolModule from "npm:my-cool-module";

## Rebuilds & Caching

We're careful to only re-invoke browserify when necessary. If your set
of imported modules remains stable and you aren't editing them,
everything is served out of cache.

If you import a new npm module or edit an already-imported one, you
get automatic rebuilds.

## Configuration Browserify

You can put a `browserify` key in your app's `config/environment.js`
to customize the behavior:

    browserify: {
      extensions: ['.coffee'],
      transforms: [
        ['caching-coffeeify', { global: true }]
      ]
    }
