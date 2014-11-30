# Ember-browserify

This is an ember-cli addon for easily loading CommonJS modules from
npm via browserify.

It works with ember-cli >= 0.1.3.

## Synopsis

Add to your ember app:

```sh
npm install --save-dev ember-browserify
```

Then `npm install` any modules you want to load into your Ember app:

```sh
npm install --save-dev my-cool-module
```

Then within your app, you can import the module:

```js
import MyCoolModule from "npm:my-cool-module";
```

## Rebuilds & Caching

We're careful to only re-invoke browserify when necessary. If your set
of imported modules remains stable and you aren't editing them,
everything is served out of cache.

If you import a new npm module or edit an already-imported one, you
get automatic rebuilds.

## Configuring Browserify

You can put a `browserify` key in your app's `config/environment.js`
to customize the behavior:

```js
browserify: {
  extensions: ['.coffee'],
  transforms: [
    ['caching-coffeeify', { global: true }]
  ]
}
```
