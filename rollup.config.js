import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import {uglify} from 'rollup-plugin-uglify';
export default {
  input: 'src/index.js',
  output: {
    file: 'dist/index.js',
    format: 'umd',
    name: 'AsyncDataMixin'
  },
  external: ['vue'],
  plugins: [
    resolve(),
    babel({
      exclude: 'node_modules/**'
    }),
    uglify({
      compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        warnings: false
      }
    })
  ]
}