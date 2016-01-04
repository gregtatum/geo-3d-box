# Changelog

### 2.0.0

Removed dependencies, and rewrote to be ES5 only. Note the require('geo-3d-box/es5') is no longer an option. The data is now all chunked in tuples like `[ [x,y,z], [x,y,z], ... ]` instead of `[ x,y,z,x,y,z,... ]` to be more in-line with stack.gl's ecosystem. In addition normals are now provided by default.

### 1.0.4

Noted the presence of ES6, and added an ES5 build.

### 1.0.3

Fixed a winding order issue

### 1.0.2

Fixed a few issues with the package.json dependencies

### 1.0.1

Fixed a few issues with the package.json dependencies