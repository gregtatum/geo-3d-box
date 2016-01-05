function _createConfig( properties ) {
	
	var config = {
		size : [1,1,1],
		segments : [1,1,1]
	}
	
	if( properties ) {
	
		if( Array.isArray( properties.size ) ) {
			config.size = properties.size
		} else if( typeof properties.size === "number" ) {
			config.size = [properties.size, properties.size, properties.size]
		}
	
		if( Array.isArray( properties.segments ) ) {
			config.segments = properties.segments
		} else if( typeof properties.segments === "number" ) {
			config.segments = [properties.segments, properties.segments, properties.segments]
		}
	}
	
	return config
}

function _flatten( array ) {
	var results = []
	
	for( var i=0; i < array.length; i++ ) {
		var subarray = array[i]
		for( var j=0; j < subarray.length; j++ ) {
			results.push(subarray[j])
		}
	}
	return results
}

function _generatePanel( config ) {
			
	var rows      = _generateGrid( config )
	var cells     = _generateCells( config, rows )
	var positions = _flatten( rows )
	var uvs       = _generateUvs( config, positions )
	
	return {
		positions   : positions,
		cells       : cells,
		uvs         : uvs,
		vertexCount : (config.sx + 1) * (config.sy + 1)
	}
}

function _generateUvs( config, positions ) {
	
	return positions.map(function(p) {
		return [
			p[0] / config.wx + 0.5,
			p[1] / config.wy + 0.5
		]
	})
}

function _generateGrid( config ) {
	
	var step   = config.wy / config.sy
	var halfY  = config.wy / 2
	var length = config.sy + 1
	var grid   = Array(length)
	
	for( var i=0; i < length; i++ ) {
		grid[i] = _generateRow( config, step * i - halfY)
	}
	
	return grid
}

function _generateRow( config, height ) {
	
	var halfX  = config.wx / 2
	var step   = config.wx / config.sx
	var length = config.sx + 1
	var row    = Array(length)
	
	for( var i=0; i < length; i++ ) {
		row[i] = [ step * i - halfX, height ]
	}
	
	return row
}

function _generateCells( config ) {
	
	function index( x, y ) {
		return (config.sx + 1) * y + x
	}
	
	var cells = []
	
	for( var x=0; x < config.sx; x++ ) {
		
		for( var y=0; y < config.sy; y++ ) {

			var a = index( x + 0, y + 0 )  //   d __ c
			var b = index( x + 1, y + 0 )  //    |  |
			var c = index( x + 1, y + 1 )  //    |__|
			var d = index( x + 0, y + 1 )  //   a    b
			
			cells.push( [ a, b, c ] )
			cells.push( [ c, d, a ] )
		}
	}
	
	return cells
}

function _clonePanel( panel ) {
	
	return {
		positions   : panel.positions,
		cells       : panel.cells,
		uvs         : panel.uvs,
		vertexCount : panel.vertexCount
	}
}

function _generateBoxPanels( config ) {
	
	var size = config.size
	var segs = config.segments
	
	//       yp  zm
	//        | /
	//        |/
	// xm ----+----- xp
	//       /|
	//      / |
	//    zp  ym
	
	var zp = _generatePanel({
		wx: size[0], wy: size[1],
		sx: segs[0], sy: segs[1]
	})
	var xp = _generatePanel({
		wx: size[2], wy: size[1],
		sx: segs[2], sy: segs[1]
	})
	var yp = _generatePanel({
		wx: size[0], wy: size[2],
		sx: segs[0], sy: segs[2]
	})
	
	var zm = _clonePanel(zp)
	var xm = _clonePanel(xp)
	var ym = _clonePanel(yp)
	
	zp.positions = zp.positions.map( function(p) { return [       p[0],       p[1],  size[2]/2 ] } )
	zm.positions = zm.positions.map( function(p) { return [       p[0],      -p[1], -size[2]/2 ] } )
	xp.positions = xp.positions.map( function(p) { return [  size[0]/2,      -p[1],       p[0] ] } )
	xm.positions = xm.positions.map( function(p) { return [ -size[0]/2,       p[1],       p[0] ] } )
	yp.positions = yp.positions.map( function(p) { return [       p[0],  size[1]/2,      -p[1] ] } )
	ym.positions = ym.positions.map( function(p) { return [       p[0], -size[1]/2,       p[1] ] } )
	
	zp.normals = _makeNormals( [ 0, 0, 1], zp.positions.length )
	zm.normals = _makeNormals( [ 0, 0,-1], zm.positions.length )
	xp.normals = _makeNormals( [ 1, 0, 0], xp.positions.length )
	xm.normals = _makeNormals( [-1, 0, 0], xm.positions.length )
	yp.normals = _makeNormals( [ 0, 1, 0], yp.positions.length )
	ym.normals = _makeNormals( [ 0,-1, 0], ym.positions.length )
	
	return [ zp, zm, xp, xm, yp, ym ]
}

function _makeNormals( normal, count ) {
	
	var normals = Array(count)
	
	for( var i=0; i < count; i++ ) {
		normals[i] = normal.slice()
	}
	
	return normals
}
	
function _generateBox( config ) {
	
	var panels = _generateBoxPanels( config )
	
	var positions = panels.map(function(panel) { return panel.positions })
	var uvs       = panels.map(function(panel) { return panel.uvs       })
	var normals   = panels.map(function(panel) { return panel.normals   })
	var cells     = _offsetCellIndices( panels )
	
	return {
		positions: _flatten( positions ),
		uvs:       _flatten( uvs ),
		cells:     _flatten( cells ),
		normals:   _flatten( normals ),
	}
}

function _offsetCellIndices( panels ) {
	
	/*
		From: [[[0,1,2],[2,3,0]],[[0,1,2],[2,3,0]]]
		To:   [[[0,1,2],[2,3,0]],[[6,7,8],[8,9,6]]]
	*/
	
	var offset = 0
	
	return panels.map(function(panel) {
		
		var offsetCells = panel.cells.map( function(cell) {
			return cell.map(function(v) {
				return v + offset
			})
		})
	
		offset += panel.vertexCount
	
		return offsetCells
	})
}

module.exports = function( properties ) {
	
	var config = _createConfig( properties )

	return _generateBox( config )
}