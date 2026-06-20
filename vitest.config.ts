import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()], // 테스트에서 '@/...' 별칭 사용 가능하게
  test: { environment: 'node' },
})
