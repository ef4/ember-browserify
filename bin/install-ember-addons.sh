#!/usr/bin/env sh

rm -rf node_modules/flooring
ln -s ../tests/dummy/lib/flooring node_modules/flooring

rm -rf node_modules/modern
ln -s ../tests/dummy/lib/modern node_modules/modern

rm -rf node_modules/outdated
ln -s ../tests/dummy/lib/outdated node_modules/outdated
