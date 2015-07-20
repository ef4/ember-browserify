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

## Using ember-browserify in addons

Wrapping generic npm libraries is a pretty common use case for ember addons. Unfortunately, ember-browserify installed on an addon cannot simply consume an npm dependency for the host app. This is a limitation of ember-cli. More info in [this issue](https://github.com/ef4/ember-browserify/issues/34) and [this issue](https://github.com/ef4/ember-browserify/issues/38). Try it, and you'll probably get this error:

```
Path or pattern "browserify/browserify.js" did not match any files
Error: Path or pattern "browserify/browserify.js" did not match any files
```

#### The workaround

To have the host app consume the npm dependency, **ember-browserify and the npm dependency must be installed in the host app** as well. So in your app, simply npm install ember-browserify and whatever npm dependencies you need consumed by ember-browserify.

Eventually, ember-cli will be able to directly pull in npm depedencies to an ember app without the need for ember-browserify. Progress on this ember-cli feature can be tracked in [this issue ticket](https://github.com/ember-cli/ember-cli/issues/4211).
