# 3d Box Geometry

Generate a 3d box, with optional segments, centered on the origin.

![Spinning Box](http://fat.gfycat.com/IgnorantDependentGorilla.gif)

	var box = require('geo-3d-box')({
		size: [5,5,5]
	  , segments: [2,2,2]
	})

or

	var box = require('geo-3d-box')({
		size: 5
	  , segments: 2
	})

The returned object is in the format of a simplicial complex with positions and cells.

	box = {
		positions: [ -2.5,-2.5,2.5,0, ... ]
	  , cells: [ 0,1,4,4,3,0, ... ]
	  , uvs: [ 0,0,0.5,0,1,0, ... ]
	}

## Size (Array or Number)

Either an array or a single number. Sets the width, height, and depth of the box. Defaults to [1,1,1].

## Segments (Array or Number)

Subdivide the cube.

## Move or modify the box

It is easy to offset the positions as needed. For instance to put the origin at the bottom.

	var _ = require('lodash)
	
	box.positions = _.chain( box.positions )
		.chunk(3)
		.each(function( vec ) {
			vec[1] += 2.5
		})
		.flatten()
		.value()

## ES6

This module is written using ES6, but gets transpiled to ES5 during the require process (if you are using Browserify.) There is an es5.js file that has already been transpiled and can be used like `require('geo-3d-box/es5')`.