var isNumber = require('lodash.isnumber')
var Map = require('lodash.map')
var Each = require('lodash.foreach')
var Flatten = require('lodash.flatten')
var Chunk = require('lodash.chunk')
var Clone = require('lodash.clone')
var Pluck = require('lodash.pluck')
var Extend = require('xtend')
var Mat4 = require('gl-mat4')

var internals = {
	
	createConfig : function( properties ) {
		
		var config = Extend({
			size     : [1,1,1]
		  , segments : [1,1,1]
		}, properties)
		
		// Normalize numbers to arrays
		
		config.size = isNumber(config.size)
			? [config.size, config.size, config.size]
			: config.size
		
		config.segments = isNumber(config.segments)
			? [config.segments, config.segments, config.segments]
			: config.segments
		
		return config
	},
	
	generatePanel : function( config ) {
				
		var rows = internals.generateGrid( config )
		var cells = internals.generateCells( config, rows )
		var uvs = internals.generateUvs( config, rows )
		
		return {
			rows: rows,
			cells: cells,
			uvs: uvs,
			vertexCount: (config.sx + 1) * (config.sy + 1)
		}
	},
	
	generateUvs : function( config, rows ) {
		
		return internals.mapRows( rows, ([x,y]) => [
			x / config.wx + 0.5,
			y / config.wy + 0.5
		] )
	},
	
	generateGrid : function( config ) {
		var step = config.wy / config.sy
		var halfY = config.wy / 2
		
		return Map( Array( config.sy + 1 ), function( v, i ) {
			return internals.generateRow( config, step * i - halfY)
		})
	},
	
	generateRow : function( config, height ) {
		
		var halfX = config.wx / 2
		var step = config.wx / config.sx
		
		return Map( Array( config.sx + 1 ), function( v, i ) {
			return [ step * i - halfX, height ]
		})
	},
	
	generateCells : function( config, rows ) {
		
		function index( x, y ) {
			return (config.sx + 1) * y + x
		}

		return Map( Array(config.sx), function( v, x ) {
			return Map( Array(config.sy), function( v, y ) {
				
				var a = index( x + 0, y + 0 )  //   d __ c
				var b = index( x + 1, y + 0 )  //    |  |
				var c = index( x + 1, y + 1 )  //    |__|
				var d = index( x + 0, y + 1 )  //   a    b
				
				return [
					a, b, c,
					c, d, a
				]
			})	
		})
		
	},
	
	generateBoxPanels : function( config ) {
		
		var mapRows = internals.mapRows
		var size = config.size
		var segs = config.segments
		
		//       yp  zm
		//        | /
		//        |/
		// xm ----+----- xp
		//       /|
		//      / |
		//    zp  ym
		
		var zp = internals.generatePanel({
			wx: size[0], wy: size[1],
			sx: segs[0], sy: segs[1]
		})
		var xp = internals.generatePanel({
			wx: size[2], wy: size[1],
			sx: segs[2], sy: segs[1]
		})
		var yp = internals.generatePanel({
			wx: size[0], wy: size[2],
			sx: segs[0], sy: segs[2]
		})
		
		var zm = Clone(zp)
		var xm = Clone(xp)
		var ym = Clone(yp)
		
		zp.rows = mapRows( zp.rows, ([x,y]) => [          x,          y,  size[2]/2 ] )
		zm.rows = mapRows( zm.rows, ([x,y]) => [          x,          y, -size[2]/2 ] )
		xp.rows = mapRows( xp.rows, ([x,y]) => [  size[0]/2,          y,          x ] )
		xm.rows = mapRows( xm.rows, ([x,y]) => [ -size[0]/2,          y,          x ] )
		yp.rows = mapRows( yp.rows, ([x,y]) => [          x,  size[1]/2,          y ] )
		ym.rows = mapRows( ym.rows, ([x,y]) => [          x, -size[1]/2,          y ] )
		
		return [ zp, zm, xp, xm, yp, ym ]
	},
	
	generateBox : function( config ) {
		
		var panels = internals.generateBoxPanels( config )
		
		var rows = Pluck(panels, "rows")
		var uvs = Pluck(panels, "uvs")
		var cells = Pluck(panels, "cells")
		
		return {
			positions: Flatten( rows, true ),
			uvs:       Flatten( uvs, true ),
			cells:     Flatten( internals.offsetCellIndices( panels ), true )
		}
	},
	
	offsetCellIndices : function( panels ) {
		
		//  [ [0,1,2,2,3,0], [0,1,2,2,3,0] ] => [ [0,1,2,2,3,0], [6,7,8,8,9,6] ]
		// return internals.mapRows( Flatten( cells ), (cellIndex, i) => cellIndex + cells.length * i )
		
		var offset = 0
		
		return Map( panels, panel => {
			
			var flattenedCells = Flatten( panel.cells, true )
			var offsetCells = Map( flattenedCells, cell => cell + offset )
		
			offset += panel.vertexCount
		
			return offsetCells
		})
	},
	
	mapRows : function( rows, fn ) {
		return Map( rows, function( row ) {
			return Map( row, fn )
		})
	},
	
}

module.exports = function( properties ) {
	
	var config = internals.createConfig( properties )
	
	return internals.generateBox( config )
}