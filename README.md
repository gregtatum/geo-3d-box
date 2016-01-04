# 3d Box Geometry

Generate a 3d box, with optional segments, centered on the origin.

![Spinning Box](http://fat.gfycat.com/IgnorantDependentGorilla.gif)

	var box = require('geo-3d-box')({
		size: [5,5,5],
		segments: [2,2,2]
	})

or

	var box = require('geo-3d-box')({
		size: 5,
		segments: 2
	})

The returned object is in the format of a simplicial complex with positions and cell indices (faces). In addition uvs and normals are generated.

	box = {
		positions: [ [x,y,z], [x,y,z], ... ],
		cells: [ [0,1,4], [4,3,0], ... ],
		uvs: [ [u,v], [u,v], ... ],
		normals: [ [x,y,z], [x,y,z], ... ],
	}

## Size (Array or Number)

Either an array or a single number. Sets the width, height, and depth of the box. Defaults to [1,1,1].

## Segments (Array or Number)

Subdivide the cube.

## Migrating from v1.x.x

The data is now all chunked in tuples like `[ [x,y,z], [x,y,z], ... ]` instead of `[ x,y,z,x,y,z,... ]` to be more in-line with stack.gl's ecosystem. In addition normals are now provided by default.