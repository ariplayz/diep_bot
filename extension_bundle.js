// ==UserScript==
// @name         Diep.io Bot
// @description  Diep.io Bot with features like auto-aim and bullet dodge. Use with care.
// @version      0.1
// @author       PD
// @namespace    *://diep.io/
// @match        *://diep.io/
// @grant        none
// ==/UserScript==
(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":1,"buffer":2,"ieee754":3}],3:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],4:[function(require,module,exports){
var data = require("./data.js")


function l2(vec) {
    return Math.sqrt(Math.pow(vec.x, 2) + Math.pow(vec.y, 2)) + 1e-5
}

function dot(vec1,vec2) {
    return vec1.x*vec2.x + vec1.y*vec2.y
}

function toUnit(vec) {
    let len = l2(vec)
    return toVec(vec.x / len, vec.y / len)
}

function diff(start, end) {
    return toVec(end.x - start.x, end.y - start.y)
}

function dist(a, b) {
    return l2(diff(a, b))
}


function unitVecDiff(start, end) {
    return toUnit(diff(start, end))
}

function velocity(posObj) {
    return toVec(posObj.dx, posObj.dy)
}

function toVec(x, y) {
    return {x: x, y: y}
}

function dbgVec(vec) {
    return `[${vec.x.toFixed(2)} ${vec.y.toFixed(2)}]`
}

AI = class {
    constructor(world) {
        this.w = world
    }

    get ownTank() {
        let ownTank = this.w.getLowestEntity(data.entityTypes.OWN_TANK)
        if (!ownTank) {
            // console.log("Cannot find own tank")
            return null
        }
        return ownTank
    }


    getTarget(aim) {
        let bestScore = 0
        let ownTank = this.ownTank;
        if (!ownTank) return null;
        let direction = unitVecDiff(ownTank, aim)
        // the range where aiming is hard so we should always choose tanks in this range
        let kDangerRange = 300 // 6 grids
        let target = null
        for (let key of Object.keys(this.w.entities)) {
            let score = 0
            let obj = this.w.entities[key]
            let d = diff(ownTank, obj)
            let heading = unitVecDiff(ownTank, obj)
            let angle = Math.acos(0.9999 * dot(heading, direction)) * 180 / 3.14
            if (d < kDangerRange && obj.entityType === data.entityTypes.TANK) {
                score = 10000000 - d
            } else if (angle > 30) {
                continue;
            } else if (obj.entityType === data.entityTypes.TANK) {
                score = 100000 - angle
            } else if (obj.entityType === data.entityTypes.UNKNOWN) {
                score = 10000 - angle
            } else if (obj.entityType === data.entityTypes.SHAPE) {
                score = 1000 - angle
            } else {
                continue
            }
            if (score > bestScore) {
                bestScore = score;
                target = key
            }
        }
        return target
    }

    // Looks at target and then rotates the look by provided number of degrees clockwise.
    // Returns the fixation point to achieve the final look.
    lookAtAngle(target, rotationDegrees, fixationDistance = 2500) {
        let ownTank = this.ownTank
        if (!ownTank) return null;
        if (!target) return null;
        let unitDirection  = unitVecDiff(ownTank, target)
        const rotation = rotationDegrees /180 * Math.PI
        // Counterclockwise since y axis if flipped
        let x = dot(toVec(Math.cos(rotation), -Math.sin(rotation)), unitDirection)
        let y = dot(toVec(Math.sin(rotation), Math.cos(rotation)), unitDirection)
        if (isNaN(x) || isNaN(y)) {
            // console.log("No position data for target")
            return null
        }
        return toVec(ownTank.x + x*fixationDistance, ownTank.y + y*fixationDistance)
    }

    // Smart aim that takes into the account the own bullet/tank speed and the velocity/distance of the target.
    // Can be also used to ram somebody with a tank body (combine with goto).
    aimAt(bulletProfile, entity) {
        let ownTank = this.ownTank
        if (!ownTank) return null;
        if (!entity) return null;

        let delta = diff(ownTank, entity)
        let deltaL2 = l2(delta)
        // linear interpolation
        let bs = bulletProfile.min + (bulletProfile.max - bulletProfile.min) * Math.max(1 - deltaL2 / bulletProfile.range, 0)
        let unitDeltaPerp = toVec(delta.y / deltaL2, -delta.x / deltaL2)
        let entPerpComponent = dot(unitDeltaPerp, velocity(entity))
        if (entPerpComponent > bs * 0.9) {
            // impossible to hit the entity with the provided bullet speed
            // console.log('hit impossible')
            return null
        }
        let directComponent = Math.sqrt(Math.pow(bs, 2) - Math.pow(entPerpComponent, 2))
        let offset = entPerpComponent / directComponent * deltaL2
        let res = {
            x: entity.x + offset * unitDeltaPerp.x,
            y: entity.y + offset * unitDeltaPerp.y,
        }
        if (isNaN(res.x) || isNaN(res.y)) {
            // console.log("No position data for target")
            return null
        }
        // console.log(`DIS: ${deltaL2.toFixed(2)} BS ${bs.toFixed(2)} ES ${entity.speed.toFixed(2)} PS ${entPerpComponent.toFixed(2)} EV ${[entity.dx.toFixed(2), entity.dy.toFixed(2)]} PV ${[unitDeltaPerp.x.toFixed(2), unitDeltaPerp.y.toFixed(2)]} O: ${offset.toFixed(2)}`)
        return res;
    }

    // Smart goto with a feedback loop. The allowOvershoot can be set to false if we want to stop exactly at the target.
    // Otherwise, the tank may pass through the target due to momentum.
    goto(target, desiredSpeed = 55, allowOvershoot = true, avoid = []) {
        if (!target) return null;
        let ownTank = this.ownTank
        if (!ownTank) return null;
        //
        // console.log(`${dbgVec(ownTank)} ->  ${dbgVec(target)} @ SPEED ${ownTank.speed.toFixed(2)}`)

        let direction = diff(ownTank, target);
        let dist = l2(direction)
        let directionUnit = toUnit(direction)
        // if no overshoot allowed, use proportional controller, start slowing down at 10 grid away (500)
        let speedFactor = allowOvershoot ? 1 : Math.min(dist / 500, 1)
        let speed = speedFactor*desiredSpeed;
        let targetVelocity = toVec(speed*directionUnit.x, speed*directionUnit.y)
        let deltaVelocityRequest = toUnit(diff(velocity(ownTank), targetVelocity))
        const desiredAvoidDist = 550.;
        const penaltyFactor = 2.5;
        var penaltyVec = toVec(0., 0.);
        for (let obj of avoid) {
            let d = diff(obj, ownTank);
            let du = toUnit(d)
            let ds = l2(d);
            let penalty = Math.max(penaltyFactor*(desiredAvoidDist - ds) / desiredAvoidDist, 0.);
            if (penalty) {
                penaltyVec = toVec(penaltyVec.x + penalty*du.x, penaltyVec.y + penalty*du.y)
            }
        }
        deltaVelocityRequest = toVec(deltaVelocityRequest.x + penaltyVec.x, deltaVelocityRequest.y + penaltyVec.y)
        if (isNaN(deltaVelocityRequest.x) || isNaN(deltaVelocityRequest.y)) {
            // console.log("No position for target")
            return null
        }
        // just select the direction that has the highest dot product with the delta velocity request
        let bestCosine = 0
        let bestDirection = null
        for (let direction of Object.keys(data.directionAccelerations)) {
            let cosine = dot(data.directionAccelerations[direction], deltaVelocityRequest)
            if (cosine > bestCosine) {
                bestCosine = cosine
                bestDirection = direction
            }
        }
        return {
            key: data.directionKeys[bestDirection],
        }
    }

    ramInto(target, avgTankSpeed = 50, maxTankSpeed=66, reverseLook = true) {
        if (!target) return null;
        let ownTank = this.ownTank
        if (!ownTank) return null;
        // Point that we want to hit.
        let point = this.aimAt({max: avgTankSpeed, min: avgTankSpeed, range: 10}, target)
        // How to get to this point ASAP?
        let movement = this.goto(point, maxTankSpeed, true)
        let fixation = this.lookAtAngle(point, reverseLook ? 180 : 0)

        let result = {}
        Object.assign(result, movement)
        Object.assign(result, fixation)
        return result
    }

    follow(target, avgTankSpeed, maxTankSpeed, keepDistance, avoid = []) {
        if (!target) return null;
        let ownTank = this.ownTank
        if (!ownTank) return null;
        // Point where we want to walk to with tank.
        let walkPoint = this.aimAt({max: avgTankSpeed, min: avgTankSpeed, range: 10}, target)
        if (!walkPoint) {
            // try to approach even if not feasible
            walkPoint = target
        }
        let distance = dist(target, ownTank)
        walkPoint = this.lookAtAngle(walkPoint, 0, distance - keepDistance)
        return this.goto(walkPoint, maxTankSpeed, false, avoid)

    }

    huntDown(target, bulletProfile, avgTankSpeed, maxTankSpeed, keepDistance) {
        if (!target) return null;
        let ownTank = this.ownTank
        if (!ownTank) return null;

        // Point that we want to hit with a bullet.
        let hitPoint = this.aimAt(bulletProfile, target)

        let result = {}
        Object.assign(result, this.follow(target, avgTankSpeed, maxTankSpeed, keepDistance));
        Object.assign(result, hitPoint)
        return result
    }

    dodgeBullets() {

    }
}

module.exports = {AI: AI, unitVecDiff, dot}
},{"./data.js":6}],5:[function(require,module,exports){
const { World } = require("./world.js");
const  data = require("./data.js");
const tank_ = require("./tank.js");
const {AI, unitVecDiff, dot} = require("./ai.js");

function getDefaultInputPacket() {
    return {
        kind: data.outPacketKinds.INPUT,
            key: 0,
        x: 0,
        y: 0,
    }
}

const Bot = class {
    constructor(sansboxMode = true, tankConfig = tank_.dragonConfig) {
        if (!sansboxMode) {
            throw "Only sandbox is supported."
        }
        this.w = new World()
        this.ai = new AI(this.w)
        this.setTankConfig(tankConfig);
        this.spawned = false
        // this.strategy = (inputPacket) => {return this.universalStrategy(inputPacket)}
        this.strategy = this.getBodyguardStrategy()
        this.allies = {}
        this.aimlessTarget = {x: 0, y: 0}
        this.master = null
        this.attackOn = true;
        this.id = 0
        this.numBots = 1
    }

    handleCommand(c) {
        if (!c) {
            return;
        }
        if (c.type === "master") {
            this.master = c.target || null;
            if (this.master) {
                this.allies[this.master.entityId] = 1
            }
        } else if (c.type === "attack") {
            this.attackOn = c.on;
        }
    }

    setTankConfig(tankConfig) {
        this.tankConfig = tankConfig
        this.buildManager = new tank_.TankBuildManager(this.tankConfig)
    }

    reset() {
        this.w.clear()
        this.buildManager.reset()
        return [
            {
                kind: data.outPacketKinds.INPUT,
                x: 0,
                y: 0,
                key: data.keyInput.SUICIDE,
            },
            {
                kind: data.outPacketKinds.CLEAR_DEATH,
            },
            {
                kind: data.outPacketKinds.SPAWN,
                name: "Guard",
            },
        ]
    }

    noTargetStrategy(inputPacket) {
        // Object.assign(inputPacket, {key: data.keyInput[Object.keys(data.directionKeys)[this.w.frame % 8]]})
        if (Math.random() < 5e-3 || this.aimlessTarget.x === 0) {
            this.aimlessTarget = {x: (Math.random()-0.5)*5000, y: (Math.random()-0.5)*5000,}
        }
        Object.assign(inputPacket, this.ai.goto(this.aimlessTarget, 55, true, this.getAlliedEntitites()));
        return inputPacket
    }

    getAlliedEntitites() {
        let res = []
        for (let id of Object.keys(this.allies)) {
            let cand = this.w.entities[id]
            if (cand) {
                res.push(cand)
            }
        }
        return res
    }

    getBodyguardStrategy() {
        if (this.tankConfig.ramming) {
            throw "Rammer cannot be a body guard."
        }
        var step = 0
        var lastEnemySeen = step
        return (inputPacket) => {
            step++;
            if (!this.master) {
                return this.universalStrategy(inputPacket)
            }
            inputPacket.key |= data.keyInput.LEFT_MOUSE
            inputPacket.key ^= data.keyInput.LEFT_MOUSE
            let tankConfig = this.tankConfig;

            let masterId = this.master.entityId;
            let master = this.w.entities.hasOwnProperty(masterId) ? this.w.entities[masterId] : this.master;

            let target = this.w.getLowestEntity(data.entityTypes.TANK, this.allies)
            let targetLook = this.ai.aimAt(tankConfig.bulletProfile, target)

            Object.assign(inputPacket, this.ai.follow(master, tankConfig.avgTankSpeed, tankConfig.maxTankSpeed, 660, this.getAlliedEntitites()));
            let masterLook = this.ai.aimAt(tankConfig.bulletProfile, master)
            if  (step - lastEnemySeen > 10 && false) {
                Object.assign(inputPacket, masterLook);
            } else {
                // Avoid aiming at the master if recently shooting...
                Object.assign(inputPacket, this.ai.lookAtAngle(masterLook, 180));

            }
            if (targetLook && masterLook && dot(unitVecDiff(this.ai.ownTank, masterLook), unitVecDiff(this.ai.ownTank, targetLook)) < 0.77) {
                lastEnemySeen = this.w.frame
                Object.assign(inputPacket, targetLook);
                if (this.attackOn) {
                    inputPacket.key |= data.keyInput.LEFT_MOUSE
                }
            }

            return [inputPacket]
        }
    }

    universalStrategy(inputPacket) {
        let oldKey = inputPacket.key || 0;
        let target = this.w.getLowestEntity(data.entityTypes.TANK, this.allies)
        let tankConfig = this.tankConfig;
        if (target) {
            if (this.tankConfig.ramming) {
                Object.assign(inputPacket, this.ai.ramInto(target, tankConfig.avgTankSpeed, tankConfig.maxTankSpeed, tankConfig.reverseShoot));
            } else {
                Object.assign(inputPacket, this.ai.huntDown(target, tankConfig.bulletProfile, tankConfig.avgTankSpeed, tankConfig.maxTankSpeed, tankConfig.keepDist));
            }
            if (this.attackOn) {
                inputPacket.key |= data.keyInput.LEFT_MOUSE
            }
        } else {
            inputPacket = this.noTargetStrategy(inputPacket)
        }
        inputPacket.key |= oldKey
        return [inputPacket]
    }

    // Only these 2 methods are public.

    worldUpdate(updatePacket) {
        this.w.eatUpdate(updatePacket)
    }

    // If this method fails then the connection should be reset.
    getOutPackets(userInputPacket = null) {
        let inputPacket = userInputPacket || getDefaultInputPacket();
        if (!this.spawned) {
            this.spawned = true;
            return this.reset()
        }
        if (!this.buildManager.initDone) {
            try {
                return this.buildManager.maybeGetInitPackets(this.w)
            } catch (e) {
                return this.reset()
            }
        }
        if (!this.w.checkAliveAndOk()) {
            return this.reset()
        }
        if (this.strategy) {
            return this.strategy(inputPacket)
        }
        return [inputPacket]

    }
}

module.exports = {Bot}
},{"./ai.js":4,"./data.js":6,"./tank.js":11,"./world.js":12}],6:[function(require,module,exports){
const updateKinds = {
    CREATE: 1,
    UPDATE: 2,
}

const inPacketKinds = {
    // Inbound.
    UPDATE: 0,
    UPDATE_COMPRESSED: 2,
    IGNORE: -1,
}

const outPacketKinds = {
    INIT: 0,
    INPUT: 1,
    SPAWN: 2,
    UPDATE_STAT: 3,
    UPDATE_TANK: 4,
    HEARTBEAT: 5,
    UNKNOWN: 6,
    EXT_FOUND: 7,
    CLEAR_DEATH: 8,
    TAKE_TANK: 9,
}


const entityTypes = {
    UNKNOWN: "UNKNOWN",
    TANK: "TANK",
    BULLET: "BULLET",
    SHAPE: "SHAPE",
    BOT: "BOT",
    OWN_TANK: "OWN_TANK",
    LEADER_TANK: "LEADER_TANK",
    MASTER_TANK: "MASTER_TANK",
}


var fieldIdToType = { '1': 'vi',
  '2': 'vi',
  '3': 'vi',
  '5': 'float',
  '8': 'vi',
  '13': 'vi',
  '17': 'vi',
  '18': 'float',
  '19': 'vi',
  '22': 'float',
  '23': 'float',
  '25': 'float',
  '26': 'float',
  '30': 'float',
  '31': 'float',
  '37': 'vi',
  '45': 'float',
  '49': 'float',
  '55': 'float',
}
// From sandbox.
Object.assign(fieldIdToType, { '1': 'vi',
  '2': 'vi',
  '3': 'vi',
  '5': 'float',
  '8': 'vi',
  '13': 'vi',
  '17': 'vi',
  '19': 'vi',
  '21': 'float',
  '22': 'float',
  '23': 'float',
  '24': 'i32',
  '25': 'float',
  '26': 'float',
  '30': 'float',
  '31': 'float',
  '37': 'vi',
  '45': 'float',
  '49': 'float',
  '50': 'float',
  '53': 'vi',
  '55': 'float',
  '58': 'vi',
  '59': 'vi',
  '68': 'float' }
)


// Just these fields are needed...
var fieldNameToId = {
    // agentPosX2: 26,
    // agentPosY2: 30,
    objPosX: 1,
    objPosY: 2,
    objAngle: 3
}



var fieldIdToName = {}
for (let k of Object.keys(fieldNameToId)) {
    fieldIdToName[fieldNameToId[k]] = k
}


const keyInput = {
    LEFT_MOUSE: 1,
    UP: 2,
    LEFT: 4,
    DOWN: 8,
    RIGHT: 16,
    GOD_MODE: 32,
    SUICIDE: 64,
    RIGHT_MOUSE: 128,
    INSTANT_UPGRADE: 256,
    USE_GAMEPAD: 512,
    SWITCH_CLASS: 1024,
    TRUE_CONST: 2048,
}

const directionKeys = {
    UP: keyInput.UP,
    RIGHT_UP: keyInput.RIGHT | keyInput.UP,
    RIGHT: keyInput.RIGHT,
    RIGHT_DOWN: keyInput.RIGHT | keyInput.DOWN,
    DOWN: keyInput.DOWN,
    LEFT_DOWN: keyInput.LEFT | keyInput.DOWN,
    LEFT: keyInput.LEFT,
    LEFT_UP: keyInput.LEFT | keyInput.UP,
}

const directionAccelerations = {
    UP: {x: 0, y: -1},
    RIGHT_UP: {x: 0.707, y: -0.707},
    RIGHT: {x: 1, y: 0},
    RIGHT_DOWN: {x: 0.707, y: 0.707},
    DOWN: {x: 0, y: 1},
    LEFT_DOWN: {x: -0.707, y: 0.707},
    LEFT: {x: -1, y: 0},
    LEFT_UP: {x: -0.707, y: -0.707}
}


const Table = class {
    constructor(table = [], processBy = 0) {
        let processor = processBy === 'function' ? processBy : i => i ^ processBy
        this.table = table
        this.length = table.length

        this.lookup = {}
        this.reverse = {}
        for (let i = 0; i < table.length; i++) {
            this.lookup[processor(i)] = table[i]
            this.reverse[table[i]] = processor(i)
        }
    }

    get(id) {
        return this.lookup[id]
    }

    find(name) {
        if (!this.reverse.hasOwnProperty(name)) {
            throw name
        }
        return this.reverse[name]
    }
}

const statTable = new Table([
    8, // Movement speed
    7,
    6,
    5,
    4,
    3,
    2,
    1, // Health Regen
], 0)


// Useless...
const tankTable = new Table([
    'Tank',
    'Twin',
    'Triplet',
    'Triple Shot',
    'Quad Tank',
    'Octo Tank',
    'Sniper',
    'Machine Gun',
    'Flank Guard',
    'Tri-Angle',
    'Destroyer',
    'Overseer',
    'Overlord',
    'Twin-Flank',
    'Penta Shot',
    'Assassin',
    'Arena Closer',
    'Necromancer',
    'Triple Twin',
    'Hunter',
    'Gunner',
    'Stalker',
    'Ranger',
    'Booster',
    'Fighter',
    'Hybrid',
    'Manager',
    'Mothership',
    'Predator',
    'Sprayer',
    '',
    'Trapper',
    'Gunner Trapper',
    'Overtrapper',
    'Mega Trapper',
    'Tri-Trapper',
    'Smasher',
    '', // Mega Smasher?
    'Landmine',
    'Auto Gunner',
    'Auto 5',
    'Auto 3',
    'Spread Shot',
    'Streamliner',
    'Auto Trapper',
    'Dominator', // Destroyer
    'Dominator', // Gunner
    'Dominator', // Trapper
    'Battleship',
    'Annihilator',
    'Auto Smasher',
    'Spike',
    'Factory',
    '', // Ball, Mounted Turret?
    'Skimmer',
    'Rocketeer',
], 0)


module.exports = {
    updateKinds: updateKinds,
    inPacketKinds: inPacketKinds,
    entityTypes: entityTypes,
    fieldIdToType: fieldIdToType,
    fieldIdToName: fieldIdToName,
    tankTable: tankTable,
    statTable: statTable,
    outPacketKinds: outPacketKinds,
    keyInput: keyInput,
    directionAccelerations: directionAccelerations,
    directionKeys: directionKeys,
}
},{}],7:[function(require,module,exports){
(function (Buffer){(function (){
var data = require("./data.js");


let convo = new ArrayBuffer(4);
let u8 = new Uint8Array(convo);
let i32 = new Uint32Array(convo);
let float = new Float32Array(convo);

let endianSwap = val =>
    ((val & 0xff) << 24)
    | ((val & 0xff00) << 8)
    | ((val >> 8) & 0xff00)
    | ((val >> 24) & 0xff);

const Encoder = class {
    constructor() {
        this.length = 0
        this.buffer = new Uint8Array(4096)
    }

    i8(num) {
        this.buffer[this.length] = num
        this.length += 1
        return this
    }

    i32(num) {
        i32[0] = num
        this.buffer.set(u8, this.length)
        this.length += 4
        return this
    }

    float(num) {
        float[0] = num
        this.buffer.set(u8, this.length)
        this.length += 4
        return this
    }

    vu(num) {
        do {
            let part = num
            num >>>= 7
            if (num) part |= 0x80
            this.buffer[this.length++] = part
        } while (num)
        return this
    }

    vi(num) {
        let sign = (num & 0x80000000) >>> 31
        if (sign) num = ~num
        let part = (num << 1) | sign
        this.vu(part)
        return this
    }

    vf(num) {
        float[0] = num
        this.vi(endianSwap(i32[0]))
        return this
    }

    string(str) {
        if (str) {
            let bytes = new Uint8Array(Buffer.from(str))
            this.buffer.set(bytes, this.length)
            this.length += bytes.length
        }
        this.buffer[this.length++] = 0
        return this
    }

    out() {
        return this.buffer.buffer.slice(0, this.length)
    }

    dump() {
        return Array.from(this.buffer.subarray(0, this.length)).map(r => r.toString(16).padStart(2, 0)).join(' ')
    }


    encodeOutbound(packet) {
        switch (packet.kind) {
            case data.outPacketKinds.INIT:
                return this.encodeInit(packet)
            case data.outPacketKinds.INPUT:
                return this.encodeInput(packet)
            case data.outPacketKinds.SPAWN:
                return this.encodeSpawn(packet)
            case data.outPacketKinds.UPDATE_STAT:
                return this.encodeUpdateStat(packet)
            case data.outPacketKinds.UPDATE_TANK:
                return this.encodeUpdateTank(packet)
            case data.outPacketKinds.EXT_FOUND:
                // Hah, we do not want to inform anybody that we are cheating
                return false
            default:
                // passthrough
                if (packet.data) {
                    return packet.data
                } else {
                    return this.vu(packet.kind).out()
                }
        }
    }

    encodeInput(packet) {
        return this.vu(packet.kind).vu(packet.key).vf(packet.x).vf(packet.y).out()
    }

    encodeInit(packet) {
        return this.vu(packet.kind).string(packet.build).string(packet.unk1).string(packet.partyId).string(packet.unk2).out()
    }

    encodeSpawn(packet) {
        return this.vu(packet.kind).string(packet.name).out()
    }
    encodeUpdateStat(packet) {
        return this.vu(packet.kind).vu(packet.statId).vu(packet.upto).out()
    }

    encodeUpdateTank(packet) {
        return this.vu(packet.kind).vu(packet.tankId).out()
    }

}



module.exports = {Encoder: Encoder};


}).call(this)}).call(this,require("buffer").Buffer)
},{"./data.js":6,"buffer":2}],8:[function(require,module,exports){
var data = require("./data.js");
const tank_ = require("./tank.js");
var {Parser} = require("./parser.js");
const {Encoder} = require("./encoder.js");
const { Bot } = require("./bot.js")
const { inject } = require("./injection.js")


// Select a tank.
while (1) {
    var tank = window.prompt(`Which tank to use? Select one from: ${Object.keys(tank_.tankTypes)}`) || 'predator'
    if (tank_.tankTypes.hasOwnProperty(tank)) {
        break
    } else {
        window.alert("No such tank: " +  tank + " (not supported).")
    }
}

let bot = new Bot(true, tank_.tankTypes[tank])
let initDone = false

// Bot starts OFF — normal gameplay by default. Press ` to toggle bot takeover.
let botActive = false

// -----------------
// Status overlay

var overlay = (function() {
    var div = document.createElement('div')
    div.style.cssText = 'position:fixed;top:10px;right:10px;background:rgba(0,0,0,0.7);color:#fff;padding:6px 14px;border-radius:6px;font:bold 13px monospace;z-index:9999;pointer-events:none;line-height:1.8'
    document.body.appendChild(div)
    return div
})()

function updateOverlay() {
    overlay.innerHTML = 'DIEP BOT [<code>`</code>]: <span style="color:' + (botActive ? '#4f4' : '#f44') + '">' + (botActive ? 'ON — bot in control' : 'OFF — normal play') + '</span>'
}
updateOverlay()

document.addEventListener('keydown', function(e) {
    if (e.key === '`') {
        botActive = !botActive
        if (botActive) {
            // Reset so the bot re-initialises its build on next spawn cycle.
            bot.spawned = false
        }
        updateOverlay()
        console.log('[DiepBot] Bot ' + (botActive ? 'ACTIVATED — AI in control' : 'DEACTIVATED — manual play'))
    }
})

// -----------------
// WS hooks

function handleRecvData(buffer) {
    try {
        let p = new Parser(buffer)
        // Always parse world state so the bot is ready the moment it is switched on.
        bot.worldUpdate(p.parseInbound())
    } catch (e) {
        // About 5% of packets the parser currently fails to parse.
        // Not the issue though, this happens rare enough and does not affect the performance much.
        // We are able to correct for missed data.
    }
    return buffer
}

function sendPackets(wsInstance, packets) {
    for (let packet of packets) {
        let enc = new Encoder()
        proxiedSend.call(wsInstance, enc.encodeOutbound(packet))
    }
    return null
}

function handleSendData(buffer) {
    let p = new Parser(buffer)
    let packet = p.parseOutbound()
    if (packet.kind === data.outPacketKinds.EXT_FOUND) {
        return null
    } else if (packet.kind === data.outPacketKinds.SPAWN) {
        initDone = true
        bot.spawned = false
        return buffer
    }
    if (packet.kind === data.outPacketKinds.INPUT) {
        // When bot is active and the game is initialised, hand control to the AI.
        if (botActive && initDone) {
            return sendPackets(this, bot.getOutPackets())
        }
        // Otherwise pass the player's own input straight through untouched.
        return buffer
    }
    return buffer
}

// -----------------
// WS Injection.
var proxiedSend = inject(handleRecvData, handleSendData);
},{"./bot.js":5,"./data.js":6,"./encoder.js":7,"./injection.js":9,"./parser.js":10,"./tank.js":11}],9:[function(require,module,exports){

function inject(handleRecvData, handleSendData) {
    var wsInstances = new Set();
    var proxiedSend = window.WebSocket.prototype.send;

    window.WebSocket.prototype.send = function (data_) {
        // Data is provided as the UInt8 view, any kind of buffer or view can be returned.
        let data = new Uint8Array(data_)
        if (!wsInstances.has(this)) {
            console.log("Hello: New WebSocket is being used.")
            wsInstances.add(this);
            var inst = this;
            var proxiedRecv = inst.onmessage;
            this.onmessage = function (event) {
                if (handleRecvData) {
                    event.data = handleRecvData.call(this, new Uint8Array(event.data));
                }
                if (event.data) {
                    return proxiedRecv.call(this, event);
                }
            };
        }
        try {
            if (handleSendData) {
                data = handleSendData.call(this, data);
            }
        }
        catch (e) {
            console.log(e)
        }
        if (data) {
            return proxiedSend.call(this, data);
        }
    };
    console.log('injection ok')
    return proxiedSend
}

module.exports = { inject }
},{}],10:[function(require,module,exports){
var data = require("./data.js")

let convo = new ArrayBuffer(4)
let u8 = new Uint8Array(convo)
let i32 = new Uint32Array(convo)
let float = new Float32Array(convo)

const Parser = class {
    constructor(content) {
        this.at = 0
        this.buffer = new Uint8Array(content)
        this.curEntityId = ''
    }

    i8() {
        let res = this.buffer[this.at++]
        this.assertNotOOB()
        return res

    }

    endianSwap(val) {
        return ((val & 0xff) << 24)
            | ((val & 0xff00) << 8)
            | ((val >> 8) & 0xff00)
            | ((val >> 24) & 0xff)
    }


    i32() {
        u8.set(this.buffer.subarray(this.at, this.at += 4))
        this.assertNotOOB()
        return i32[0]
    }

    float() {
        u8.set(this.buffer.subarray(this.at, this.at += 4))
        this.assertNotOOB()
        return float[0]
    }

    vleft() {
        this.at--
        let i = 1
        while (this.buffer[this.at - 1] & 0x80 && i < 4) {
            this.at--
            i++
        }
    }

    vu() {
        let out = 0
        let at = 0
        while (this.buffer[this.at] & 0x80) {
            out |= (this.buffer[this.at++] & 0x7f) << at
            at += 7
        }
        out |= this.buffer[this.at++] << at
        this.assertNotOOB()
        return out
    }

    vi() {
        let out = this.vu()
        let sign = out & 1
        out >>= 1
        if (sign) out = ~out
        this.assertNotOOB()
        return out
    }

    vf() {
        i32[0] = this.endianSwap(this.vi())
        this.assertNotOOB()
        return float[0]
    }

    string() {
        let res = ""
        while (this.buffer[this.at]) {
            res += String.fromCharCode(this.buffer[this.at])
            this.at++
        }
        this.at++
        this.assertNotOOB()
        return res
    }

    getByteString(start, end) {
        let bytes = ""
        while (start < end && start < this.buffer.length) {
            let num = this.buffer[start]
            bytes += (num < 16 ? '0' : '') + num.toString(16) + " "
            start++
        }
        return bytes
    }

    isEOF() {
        return this.at === this.buffer.length
    }

    raiseUnexpected(msg, payload) {
        // The error could be the result of the parsing error at the earlier position.
        let info = `Error at pos ${this.at}: ${msg}`
        if (payload !== 'tolerate') {
              // console.log(info)
        }
        let err = new Error(info)
        err.payload = payload
        throw err
    }

    assertEOF() {
        if (!this.isEOF()) {
            this.raiseUnexpected("Expected end of packet.")
        }
    }

    assertNotOOB() {
        if (this.at > this.buffer.length) {
            this.raiseUnexpected("Unexpected end of packet.")
        }
    }

    assertNoIntersectingKeys(obja, objb) {
        return
        for (let key of Object.keys(obja)) {
            if (objb.hasOwnProperty(key)) {
                this.raiseUnexpected(`Duplicate field ${key} (${obja[key]} vs ${objb[key]})`)
            }
        }
    }


    // Format

    parseOutbound() {
        let packet_kind_id = this.i8()
        switch (packet_kind_id) {
            case data.outPacketKinds.INIT:
                return this.parseInit()
            case data.outPacketKinds.INPUT:
                return this.parseInput()
            case data.outPacketKinds.SPAWN:
                return this.parseSpawn()
            case data.outPacketKinds.UPDATE_STAT:
                return this.parseUpdateStat()
            case data.outPacketKinds.UPDATE_TANK:
                return this.parseUpdateTank()
            default:
                return {
                    kind: packet_kind_id,
                    data: this.buffer,
                }

        }
    }

    parseInput() {
        let res = {
            kind: data.outPacketKinds.INPUT,
            key: this.vu(),
            x: this.vf(),
            y: this.vf(),
        }
        if (!this.isEOF()) {
            // console.log("Unexpected end of output 'input' packet.")
        }
        this.assertEOF()
        return res
    }

    parseInit() {
        if (this.isEOF()) {
            return {kind: data.outPacketKinds.INIT}
        }
        let res = {
            kind: data.outPacketKinds.INIT,
            build: this.string(),
            unk1: this.string(),
            partyId: this.string(),
            unk2: this.string(),
        }
        this.assertEOF()
        return res
    }

    parseSpawn() {
        let res = {
            kind: data.outPacketKinds.SPAWN,
            name: this.string(),
        }
        this.assertEOF()
        return res
    }

    parseUpdateStat() {
        let res = {
            kind: data.outPacketKinds.UPDATE_STAT,
            statId: this.vu(),
            upto: this.vu(),
        }
        this.assertEOF()
        return res
    }

    parseUpdateTank() {
        let res = {
            kind: data.outPacketKinds.UPDATE_TANK,
            tankId: this.vu(),
        }
        this.assertEOF()
        return res
    }


    parseInbound() {
        let packet_kind_id = this.i8()
        if (packet_kind_id === data.inPacketKinds.UPDATE) {
            if (this.buffer.length < 2) {
                return this.ignorePacket("?")
            } else {
                return this.updatePacket()
            }
        } else if (packet_kind_id === data.inPacketKinds.UPDATE_COMPRESSED) {
            return this.updateCompressedPacket()
        } else {
            return this.ignorePacket(packet_kind_id)
        }
    }

    updatePacket() {
        let updateId = this.vu()
        let result = {
            kind: data.inPacketKinds.UPDATE,
            updateId: updateId,
            deletes: this.multiEntityDeletes(),
            upcreates: this.multiEntityUpcreates(),
        }
        this.assertEOF()
        return result
    }

    updateCompressedPacket() {
        this.raiseUnexpected("UPDATE_COMPRESSED not supported", "compressed")
    }

    ignorePacket(ignore_reason) {
        return {
            kind: data.inPacketKinds.IGNORE,
            ignore_reason: ignore_reason,
        }
    }

    entityId() {
        let eid = this.vu() + '#' + this.vu()
        this.curEntityId = eid
        return eid
    }

    isMatch(arr) {
        if (this.at + arr.length > this.buffer.length) {
            return false
        }
        for (let i = 0; i < arr.length; i++) {
            if (this.buffer[i + this.at] !== arr[i]) {
                return false
            }
        }
        return true
    }


    moveToNextCreate() {
        while (++this.at < this.buffer.length) {
            if (this.entityCreateTypeId() !== data.entityTypes.UNKNOWN && this.buffer[this.at - 1] === 0 && this.buffer[this.at - 2] === 1) {
                this.vleft()
                this.vleft()
                this.vleft()
                this.vleft()
                return
            }
        }
        this.assertEOF()
    }

    entityCreateTypeId() {
        if (this.isMatch([2, 0, 5, 3, 0, 3])) {
            return data.entityTypes.TANK
        } else if (this.isMatch([2, 0, 7, 0, 1])) {
            return data.entityTypes.BULLET
        } else if (this.isMatch([2, 0, 5, 3, 0, 1])) {
            return data.entityTypes.SHAPE
        } else {
            //         let fol = this.getByteString(this.at, this.buffer.length)
            //
            // console.log("UNKNOWN TYPE: ", fol)
            return data.entityTypes.UNKNOWN
        }
    }

    fieldIdSpec() {
        return this.vu() ^ 1
    }

    updateKind() {
        let create = this.vu()
        let update = this.vu()
        if (create === 1 && update === 0) {
            return data.updateKinds.CREATE
        } else if (create === 0 && update === 1) {
            return data.updateKinds.UPDATE

        } else {
            console.log()
            this.raiseUnexpected(`Unknown update type: ${create} ${update}`, update === 9 ? 'tolerate' : null)
        }
    }

    multiEntityDeletes() {
        let num_deletes = this.vu()
        var deletes = []
        for (var i = 0; i < num_deletes; i++) {
            deletes.push(this.entityId())
        }
        return deletes
    }

    multiEntityUpcreates() {
        let num_upcreates = this.vu()
        var upcreates = []
        for (var i = 0; i < num_upcreates; i++) {
            if (this.isEOF()) {
                // console.log('unexpected eof...')
                break
            }
            upcreates.push(this.entityUpcreate())
        }
        this.assertEOF()
        return upcreates

    }

    entityUpcreate() {
        let entityId = this.entityId()
        let updateKind = this.updateKind()
        let result = {
            entityId: entityId,
            updateKind: updateKind,
        }
        if (updateKind === data.updateKinds.CREATE) {
            Object.assign(result, this.entityCreate())
        } else if (updateKind === data.updateKinds.UPDATE) {
            Object.assign(result, this.entityUpdate())

        } else {
            this.raiseUnexpected("Internal error")
        }
        return result
    }

    parseField(field_id) {
        if (!data.fieldIdToType.hasOwnProperty(field_id)) {
            this.raiseUnexpected(`Unknown property field_id: ${field_id} @ ${this.curEntityId}`, field_id)
        }
        let field_type = data.fieldIdToType[field_id]
        if (!(field_type in this)) {
            this.raiseUnexpected(`Internal error: method to parse field_type ${field_name} not implemented`)
            return {}
        }
        let result = {}
        let fieldName = data.fieldIdToName.hasOwnProperty(field_id) ? data.fieldIdToName[field_id] : `unk_${field_type}_${field_id}`
        result[fieldName] = this[field_type]()
        return result
    }


    entityUpdate() {
        let field_id = this.fieldIdSpec()
        let result = {}
        while (1) {
            let field_result = this.parseField(field_id)
            this.assertNoIntersectingKeys(result, field_result)
            Object.assign(result, field_result)
            let next_field_id_diff = this.fieldIdSpec()
            if (next_field_id_diff === 0) {
                // No more fields ot parse for this entity.
                break
            }
            field_id += next_field_id_diff
        }
        return result

    }

    entityCreate() {
        let entityType = this.entityCreateTypeId()
        if (entityType === data.entityTypes.UNKNOWN) {
            this.raiseUnexpected(`Entity create: ${this.curEntityId}, ${entityType}.`, 'create')
        }
        let res = {entityType: entityType}
        this.moveToNextCreate()
        return res
    }
}


function bytesToBuffer(bytes) {
    let buffer = new ArrayBuffer(bytes.length)
    let buffer_view = new Uint8Array(buffer)
    let i = 0
    for (let byte of bytes) {
        buffer_view[i++] = byte
    }
    return buffer
}

function byteStringToBuffer(byteString) {
    let byte_strs = byteString.split(' ')
    let bytes = []
    for (let byte_str of byte_strs) {
        bytes.push(parseInt(byte_str, 16))
    }
    return bytesToBuffer(bytes)
}

module.exports = {Parser: Parser, byteStringToBuffer: byteStringToBuffer, bytesToBuffer: bytesToBuffer}
},{"./data.js":6}],11:[function(require,module,exports){
var data = require("./data.js")


const tankConfigTemplate = {
    bulletProfile: {
        max: 111,
        min: 64,
        range: 1500,
    },
    maxTankSpeed: 66,
    avgTankSpeed: 50,
    reverseShoot: false,
    ramming: false,
    keepDist: 800,

}


const sniperConfig = {
    bulletProfile: {
        max: 111,
        min: 64,
        range: 1500,
    },
    maxTankSpeed: 60,
    avgTankSpeed: 40,
    reverseShoot: false,
    ramming: false,
    stat: [5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 4, 4, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8],
    seq: [80],
    keepDist: 1100,
}

const predatorConfig = {
    bulletProfile: {
        max: 111,
        min: 64,
        range: 1500,
    },
    maxTankSpeed: 60,
    avgTankSpeed: 40,
    reverseShoot: false,
    ramming: false,
    stat: [5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 4, 4, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8],
    seq: [80, 122, 100],
    keepDist: 1100,
}


const dragonConfig = {
    bulletProfile: {
        max: 55,
        min: 55,
        range: 1500,
    },
    maxTankSpeed: 60,
    avgTankSpeed: 40,
    reverseShoot: false,
    ramming: false,
    stat: [5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 3, 2, 3, 2, 3],
    seq: [76, 78, 108],
    keepDist: 100,
}

const fighterConfig = {
    bulletProfile: {
        max: 55,
        min: 55,
        range: 1500,
    },
    maxTankSpeed: 60,
    avgTankSpeed: 40,
    reverseShoot: false,
    ramming: false,
    stat: [5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8],
    seq: [76, 78, 108],
    keepDist: 800,
}

const acConfig = {
    bulletProfile: {
        max: 121,
        min: 74,
        range: 2000,
    },
    maxTankSpeed: 60,
    avgTankSpeed: 40,
    reverseShoot: false,
    ramming: false,
    stat: [5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 4, 4, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8],
    seq: [80, 74, 126],
    isAC: true,
    keepDist: 1500,
}

const aniRamConfig = {
    bulletProfile: {
        max: 30,
        min: 20,
        range: 500,
    },
    maxTankSpeed: 66,
    avgTankSpeed: 50,
    reverseShoot: true,
    ramming: true,
    stat: [2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 7, 7, 7, 7, 7, 7, 7, 1, 1, 1, 1, 1],
    seq: [82, 72, 62],
}

function normAngle(angle) {
    return Math.atan2(Math.sin(angle), Math.cos(angle))
}

// All radians. Cant believe this hack...
function getUnknownIdsWithAngle(world, angle, tolerance) {
    let ids = []
    for (let key of Object.keys(world.entities)) {
        let ent = world.entities[key]
        if (ent.hasOwnProperty('objAngle')) {
            if (Math.abs(normAngle(ent.objAngle * Math.PI / 180. - angle)) < tolerance) {
                ids.push(key)

            }
        }
    }
    return ids
}

const TankBuildManager = class {
    constructor(tankConfig, sanboxMode = true) {
        this.config = tankConfig || dragonConfig
        if (this.config.stat.length !== 33) {
            throw "Specify 33 upgrade stat points."
        }
        this.sanboxMode = sanboxMode;
        this.reset()
    }

    reset() {
        this.initDone = false;

        this.lvlPacketsSent = 0
        this.initPacketsSent = 0
        this.stage = 0
        // Own tank detection, very hacky.
        this.possibleOwn = {}
        this.lastAngle = null
        this.lastStamp = -Infinity
        this.numSamles = 0
    }

    maybeGetInitPackets(world) {
        // console.log("Init stage", this.stage)

        switch (this.stage) {
            case 0:
                // determine own tank id...
                const kNumSamples = 33
                if (this.numSamles >= kNumSamples) {
                    let own = []
                    for (let id of Object.keys(this.possibleOwn)) {
                        // Very low chance this will happen randomly.
                        if (this.possibleOwn[id] >= kNumSamples / 3) {
                            own.push(id)
                        }
                    }
                    if (own.length !== 1) {
                        console.log("Could not find the own tank id, this is fatal!", own)
                        throw new Error("own tank inference...")
                    }
                    world.entities[own[0]].entityType = data.entityTypes.OWN_TANK
                    this.stage = this.sanboxMode ? 1 : 4;
                    return this.getLVLPacket();
                }
                if (world.stamp > this.lastStamp) {
                    if (this.lastAngle) {
                        let newCands = getUnknownIdsWithAngle(world, this.lastAngle, 15 * Math.PI / 180);
                        // console.log(`Possible own ids for angle ${normAngle(this.lastAngle) / Math.PI * 180}:`, newCands)
                        // if (world.entities['1#15']) {
                        //     console.log(normAngle(world.entities['1#15'].objAngle / 180 * Math.PI) * 180 / Math.PI)
                        //
                        // }
                        for (let cand of newCands) {
                            this.possibleOwn[cand] = (this.possibleOwn[cand] || 0) + 1
                        }
                        this.numSamles++
                        // console.log(this.possibleOwn)
                    }
                    this.lastStamp = world.stamp + 2
                    this.lastAngle = Math.random() * 2 * Math.PI
                    return [{
                        kind: data.outPacketKinds.INPUT,
                        key: this.sanboxMode ? data.keyInput.INSTANT_UPGRADE : 0,
                        x: Math.cos(this.lastAngle) * 1000000,
                        y: Math.sin(this.lastAngle) * 1000000,
                    }]
                } else {
                    return []
                }
            case 1:
                if (this.lvlPacketsSent > 121 - this.numSamles) {
                    this.stage++;
                }
                this.lvlPacketsSent++
                return this.getLVLPacket()
            case 2:
                this.stage++;
                return this.getStatUpdatePackets()
            case 3:
                this.stage++;
                return this.getTankUpdatePackets();
            case 4:
                if (this.initPacketsSent > 3) {
                    this.stage++;
                }
                this.initPacketsSent++
                return this.getInitPacket()

            default:
                this.initDone = true;
                return []
        }
    }

    getLVLPacket() {
        return [
            {
                kind: data.outPacketKinds.INPUT,
                key: data.keyInput.INSTANT_UPGRADE,
                x: 0,
                y: 0,
            }
        ]
    }

    getInitPacket() {
        return [
            {
                kind: data.outPacketKinds.INPUT,
                key: data.keyInput.LEFT | data.keyInput.UP,
                x: 0,
                y: 0,
            }
        ]
    }

    getStatUpdatePackets() {
        let cnts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0}
        let packets = []
        for (let stat of this.config.stat) {
            cnts[stat]++
            if (cnts[stat] > 7) {
                throw "this will not work :)"
            }
            packets.push(
                {
                    kind: data.outPacketKinds.UPDATE_STAT,
                    statId: 2 * data.statTable.find(stat),
                    upto: 2 * cnts[stat],
                }
            )
        }
        return packets
    }

    getTankUpdatePackets() {
        let packets = []
        for (let id of this.config.seq) {
            packets.push(
                {
                    kind: data.outPacketKinds.UPDATE_TANK,
                    tankId: id,
                }
            )
        }
        if (this.config.isAC) {
            packets.push(
                {
                    kind: data.outPacketKinds.INPUT,
                    key: data.keyInput.SWITCH_CLASS,
                    x: 0,
                    y: 0,
                }
            )
        }
        return packets
    }
}

const tankTypes = {
    dragon: dragonConfig,
    fighter: fighterConfig,
    sniper: sniperConfig,
    predator: predatorConfig,
    ram: aniRamConfig,
    ac: acConfig,
}

module.exports = {
    sniperConfig: sniperConfig,
    predatorConfig: predatorConfig,
    acConfig: acConfig,
    aniRamConfig: aniRamConfig,
    dragonConfig: dragonConfig,
    fighterConfig: fighterConfig,
    tankTypes: tankTypes,
    TankBuildManager: TankBuildManager,
}
},{"./data.js":6}],12:[function(require,module,exports){
var data = require("./data.js")

const worldConfig = {
    entityTTL: 300,
    deleteDead: true
}

function hasPosition(ent) {
    return ent.hasOwnProperty('x') && ent.hasOwnProperty('y')
}

const World = class {
    constructor() {
       this.clear();
    }

    clear() {
        this.entities = {}
        this.oldEntities = {}
        this.typeInference = {"1#0": data.entityTypes.LEADER_TANK}
        this.stamp = 0
        this.frame = 0;
    }
    checkAliveAndOk() {
        if (this.frame < 250) return true;
        let thisEnt = this.getLowestEntity(data.entityTypes.OWN_TANK)
        return thisEnt && this.stamp - thisEnt.stamp  < 100
    }

    eatUpdate(packet) {
        if (packet.kind !== data.inPacketKinds.UPDATE) return
        this.frame++;
        this.stamp = packet.updateId
        this.oldEntities = JSON.parse(JSON.stringify(this.entities))
        for (let upcreate of packet.upcreates) {
            const entityId = upcreate.entityId
            if (upcreate.updateKind === data.updateKinds.CREATE) {
                if (this.entities.hasOwnProperty(entityId)) {
                    Object.assign(this.entities[entityId], upcreate)
                } else {
                    this.entities[entityId] = upcreate
                }
                // save the type of the entity permanently for the future use if needed.
                this.typeInference[entityId] = upcreate.entityType
            } else if (upcreate.updateKind === data.updateKinds.UPDATE) {
                if (this.entities.hasOwnProperty(entityId)) {
                    Object.assign(this.entities[entityId], upcreate)
                } else {
                    this.entities[entityId] = upcreate
                    this.entities[entityId].entityType = this.typeInference.hasOwnProperty(entityId) ? this.typeInference[entityId] : data.entityTypes.UNKNOWN
                }
            } else {
                continue
            }
            this.entities[upcreate.entityId].stamp = this.stamp

        }
        for (let del of packet.deletes) {
            delete this.entities[del]
        }

        this.gardener()
    }

    getLowestEntity(entityType, except = {}) {
        let id = this.getLowestEntityId(entityType, except)
        return id && this.entities[id]
    }

    getLowestEntityId(entityType, except = {}) {
        let id = null
        for (let key of Object.keys(this.entities)) {
            if (this.entities[key].entityType === entityType && !except.hasOwnProperty(key)) {
                id = !id || key < id ? key : id
            }
        }
        return id

    }

    gardener() {
        this.posUnify()
        this.inferTypes()
        this.deleteOld()
        this.inferMovement()
    }

    // Converts to the uniform position format x/y
    posUnify() {
        for (let key of Object.keys(this.entities)) {
            let ent = this.entities[key]
            let x = ent.objPosX || ent.agentPosX || ent.agentPosX2
            if (x) {
                ent.x = x
            }
            let y = ent.objPosY || ent.agentPosY || ent.agentPosY2
            if (y) {
                ent.y = y
            }
        }
    }

    // Infers types for unknown entities.
    inferTypes() {
        // if (!this.getLowestEntityId(data.entityTypes.OWN_TANK)) {
        //     this.inferOwnTank()
        // }
    }

    inferOwnTank() {
        let cands = []
        for (let key of Object.keys(this.entities)) {
            if (this.entities[key].entityType === data.entityTypes.UNKNOWN) {
                cands.push(key)
            }
        }
        let pairs = []
        for (let left of cands) {
            for (let right of cands) {
                if (left >= right) {
                    continue
                }
                if (Math.sqrt(Math.pow(this.entities[left].x - this.entities[right].x, 2) + Math.pow(this.entities[left].y - this.entities[right].y, 2)) < 10) {
                    pairs.push([left, right])
                }
            }
        }
        if (pairs.length !== 1) {
            console.log(`Could not infer own tank! ${pairs}`)
            console.log(JSON.stringify(this.entities))
            return
        }
        let id1 = pairs[0][0]
        let id2 = pairs[0][1]
        this.entities[id1].entityType = data.entityTypes.OWN_TANK
        this.entities[id2].entityType = data.entityTypes.OWN_TANK
    }

    deleteOld() {
        for (let entityId of Object.keys(this.entities)) {
            let ent = this.entities[entityId]
            if (ent.stamp + worldConfig.entityTTL < this.stamp) {
                delete this.entities[entityId]
            } else if (worldConfig.config && ent.health === 0) {
                delete this.entities[entityId]
            }
        }
    }

    inferMovement() {
        for (let key of Object.keys(this.entities)) {
            if (!this.oldEntities.hasOwnProperty(key)) {
                continue
            }
            let oldEnt = this.oldEntities[key]
            let ent = this.entities[key]

            if (!hasPosition(oldEnt) || !hasPosition(ent)) {
                continue
            }
            let dt = ent.stamp - oldEnt.stamp + 1e-5
            // 0.5 is the smoothing by default - averaging from 2 frames basically. smoothing drops to 0 for higher dt (at dt==6 smoothing is 0).
            let smoothing = 0 //1 - Math.min(0.4 + 0.11*dt, 1.)

            let dx = (ent.x - oldEnt.x) / dt
            let oldDx = ent.dx || dx
            ent.dx = (1 - smoothing) * dx + oldDx * smoothing

            let dy = (ent.y - oldEnt.y) / dt
            let oldDy = ent.dy || dy
            ent.dy = (1 - smoothing) * dy + oldDy * smoothing

            ent.speed = Math.sqrt(Math.pow(ent.dx, 2) + Math.pow(ent.dy, 2))
        }
    }
}


let a = {"1#15":{"entityId":"1#15","updateKind":2,"objAngle":25,"entityType":"UNKNOWN","stamp":251,"objPosY":456,"unk_vu_53":1,"y":456,"objPosX":-1030,"x":-1030,"dx":0,"dy":0,"speed":0,"expPointsOthert":25,"maxHealth":54,"health":45.986595153808594,"fade":51.005001068115234},"1#14":{"entityId":"1#14","updateKind":2,"agentPosY2":456.77587890625,"entityType":"UNKNOWN","stamp":223,"y":456.77587890625,"agentPosX2":-1030.7730712890625,"x":-1030.7730712890625,"dx":0,"dy":0,"speed":0,"tankMass":2,"unk_float_26":0.5445544719696045,"unk_float_27":11.133333206176758,"tankSpeed":2.4751875400543213,"tankLevel":3,"expPointsThis":25,"unk_float_59":14.98133373260498}}
let w = new World()
w.entities = a
w.inferOwnTank()
module.exports = {World: World, worldConfig: worldConfig}
},{"./data.js":6}]},{},[8]);
