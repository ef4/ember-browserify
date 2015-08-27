# Ember-browserify [![Build Status](https://travis-ci.org/ef4/ember-browserify.svg)](https://travis-ci.org/ef4/ember-browserify)

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

## Known Caveats

Ember-browserify __cannot__ be used with named imports e.g. `import { foo } from 'bar';` as we have no way of knowing at the time of browserifying what portions of the import are being used.

## Using ember-browserify in addons

Wrapping generic npm libraries is a pretty common use case for ember addons. Unfortunately, ember-browserify installed on an addon cannot simply consume an npm dependency for the host app. This is a limitation of ember-cli. More info in [this issue](https://github.com/ef4/ember-browserify/issues/34) and [this issue](https://github.com/ef4/ember-browserify/issues/38). Try it, and you'll probably get this error:

```
Path or pattern "browserify/browserify.js" did not match any files
Error: Path or pattern "browserify/browserify.js" did not match any files
```

Or you might get an error like:

```
Could not find module `npm:my-module` imported from `my-project/my-file`
```

#### The workaround

To have the host app consume the npm dependency, **ember-browserify and the npm dependency must be installed in the host app** as well *AND* the **module must be imported from within the `app/` directory of the addon**. So in your app, simply npm install ember-browserify and whatever npm dependencies you need consumed by ember-browserify. Then in your addon, make sure that you're importing the modules from a file in the `app/` folder. You can also import from the `addon/` directory *IF* you've also imported the same module in the `app/` directory. This is because ember-browserify running under the host application can't detect imports in the `addon/` directory, since the `app/` directory is the only directory merged with the application tree at build.

Eventually, ember-cli will be able to directly pull in npm depedencies to an ember app without the need for ember-browserify. Progress on this ember-cli feature can be tracked in [this issue ticket](https://github.com/ember-cli/ember-cli/issues/4211).
