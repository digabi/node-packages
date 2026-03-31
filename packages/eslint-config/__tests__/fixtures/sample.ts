/* eslint-disable prettier/prettier */
// Intentional violations for testing — do not fix.

// no-restricted-imports: warn (bluebird)
import 'bluebird'

// one-var: error
let a = 1, b = 2

// prefer-template: error
const msg = a + ' ' + b

// arrow-body-style: error
const fn = () => { return msg }

export { fn }
