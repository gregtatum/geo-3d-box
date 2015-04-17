# 3d Box Geometry

Generate a 3d box, with optional segments.

	var GenerateBox = require('geo-3d-box')
	var box = GenerateBox({
		size: [5,5,5],
		segments: [2,2,2]
	})

The returned object is in the format of a simplicial complex with positions and cells.

	box = {
		positions: [ -2.5,-2.5,2.5,0, ... ],
		cells: [ 0,1,4,4,3,0, ... ]
		uvs: [ 0,0,0.5,0,1,0, ... ],
	}
