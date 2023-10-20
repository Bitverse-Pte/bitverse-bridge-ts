import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

export default {
  input: './src/bitverse.bridge.ts',
  output: {
    file: 'dist/bitverse.bridge.js',
    format: 'iife',
  },
  plugins: [
    typescript(),
    terser(), // 添加 Terser 压缩插件
  ],
};
