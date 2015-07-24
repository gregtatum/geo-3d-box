'use strict';

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }

var isNumber = require('lodash.isnumber');
var Map = require('lodash.map');
var Each = require('lodash.foreach');
var Flatten = require('lodash.flatten');
var Chunk = require('lodash.chunk');
var Clone = require('lodash.clone');
var Pluck = require('lodash.pluck');
var Extend = require('lodash.assign');

var internals = {

	createConfig: function createConfig(properties) {

		var config = Extend({
			size: [1, 1, 1],
			segments: [1, 1, 1]
		}, properties);

		// Normalize numbers to arrays

		config.size = isNumber(config.size) ? [config.size, config.size, config.size] : config.size;

		config.segments = isNumber(config.segments) ? [config.segments, config.segments, config.segments] : config.segments;

		return config;
	},

	generatePanel: function generatePanel(config) {

		var rows = internals.generateGrid(config);
		var cells = internals.generateCells(config, rows);
		var positions = Flatten(rows);
		var uvs = internals.generateUvs(config, positions);

		return {
			positions: positions,
			cells: Flatten(cells, true),
			uvs: uvs,
			vertexCount: (config.sx + 1) * (config.sy + 1)
		};
	},

	generateUvs: function generateUvs(config, positions) {

		return Map(positions, function (_ref) {
			var _ref2 = _slicedToArray(_ref, 2);

			var x = _ref2[0];
			var y = _ref2[1];
			return [x / config.wx + 0.5, y / config.wy + 0.5];
		});
	},

	generateGrid: function generateGrid(config) {
		var step = config.wy / config.sy;
		var halfY = config.wy / 2;

		return Map(Array(config.sy + 1), function (v, i) {
			return internals.generateRow(config, step * i - halfY);
		});
	},

	generateRow: function generateRow(config, height) {

		var halfX = config.wx / 2;
		var step = config.wx / config.sx;

		return Map(Array(config.sx + 1), function (v, i) {
			return [step * i - halfX, height];
		});
	},

	generateCells: function generateCells(config, rows) {

		function index(x, y) {
			return (config.sx + 1) * y + x;
		}

		return Map(Array(config.sx), function (v, x) {
			return Map(Array(config.sy), function (v, y) {

				var a = index(x + 0, y + 0); //   d __ c
				var b = index(x + 1, y + 0); //    |  |
				var c = index(x + 1, y + 1); //    |__|
				var d = index(x + 0, y + 1); //   a    b

				return [a, b, c, c, d, a];
			});
		});
	},

	generateBoxPanels: function generateBoxPanels(config) {

		var size = config.size;
		var segs = config.segments;

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
		});
		var xp = internals.generatePanel({
			wx: size[2], wy: size[1],
			sx: segs[2], sy: segs[1]
		});
		var yp = internals.generatePanel({
			wx: size[0], wy: size[2],
			sx: segs[0], sy: segs[2]
		});

		var zm = Clone(zp);
		var xm = Clone(xp);
		var ym = Clone(yp);

		zp.positions = Map(zp.positions, function (_ref3) {
			var _ref32 = _slicedToArray(_ref3, 2);

			var x = _ref32[0];
			var y = _ref32[1];
			return [x, y, size[2] / 2];
		});
		zm.positions = Map(zm.positions, function (_ref4) {
			var _ref42 = _slicedToArray(_ref4, 2);

			var x = _ref42[0];
			var y = _ref42[1];
			return [x, -y, -size[2] / 2];
		});
		xp.positions = Map(xp.positions, function (_ref5) {
			var _ref52 = _slicedToArray(_ref5, 2);

			var x = _ref52[0];
			var y = _ref52[1];
			return [size[0] / 2, -y, x];
		});
		xm.positions = Map(xm.positions, function (_ref6) {
			var _ref62 = _slicedToArray(_ref6, 2);

			var x = _ref62[0];
			var y = _ref62[1];
			return [-size[0] / 2, y, x];
		});
		yp.positions = Map(yp.positions, function (_ref7) {
			var _ref72 = _slicedToArray(_ref7, 2);

			var x = _ref72[0];
			var y = _ref72[1];
			return [x, size[1] / 2, -y];
		});
		ym.positions = Map(ym.positions, function (_ref8) {
			var _ref82 = _slicedToArray(_ref8, 2);

			var x = _ref82[0];
			var y = _ref82[1];
			return [x, -size[1] / 2, y];
		});

		return [zp, zm, xp, xm, yp, ym];
	},

	generateBox: function generateBox(config) {

		var panels = internals.generateBoxPanels(config);

		var positions = Pluck(panels, 'positions');
		var uvs = Pluck(panels, 'uvs');
		var cells = Pluck(panels, 'cells');

		return {
			positions: Flatten(positions, true),
			uvs: Flatten(uvs, true),
			cells: Flatten(internals.offsetCellIndices(panels), true)
		};
	},

	offsetCellIndices: function offsetCellIndices(panels) {

		//  [ [0,1,2,2,3,0], [0,1,2,2,3,0] ] => [ [0,1,2,2,3,0], [6,7,8,8,9,6] ]

		var offset = 0;

		return Map(panels, function (panel) {

			var flattenedCells = Flatten(panel.cells, true);
			var offsetCells = Map(flattenedCells, function (cell) {
				return cell + offset;
			});

			offset += panel.vertexCount;

			return offsetCells;
		});
	}
};

module.exports = function (properties) {

	var config = internals.createConfig(properties);

	return internals.generateBox(config);
};

