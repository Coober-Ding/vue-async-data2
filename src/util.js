export function isObject (obj) {
  return obj !== null && typeof obj === 'object'
}

export function isFunction (func) {
  return func !== null && typeof func === 'function'
}

export function isDef (v) {
  return v !== undefined && v !== null
}

export function isTrue (v) {
  return v === true
}

