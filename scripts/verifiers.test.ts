import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

function run(script: string, args: string[] = []) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {},
  })
}

describe('command failure handling', () => {
  it('rejects invalid initializer input before mutation', () => {
    const result = run('scripts/init-template.mjs', [
      '--name',
      'Invalid',
      '--slug',
      'Not-Kebab',
      '--ai-provider',
      'mock',
    ])
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('kebab-case')
  })

  it('fails deployment verification without explicit URLs', () => {
    const result = run('scripts/verify-deployment.mjs')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('--marketing-url')
  })

  it('rejects malformed deployment URLs before making requests', () => {
    const result = run('scripts/verify-deployment.mjs', [
      '--marketing-url',
      'not-a-url',
      '--web-url',
      'https://web.example.com',
      '--api-url',
      'https://api.example.com',
    ])
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('absolute HTTP(S) URL')
  })

  it('fails E2E readiness closed without printing values', () => {
    const result = run('scripts/e2e-doctor.mjs')
    expect(result.status).toBe(1)
    expect(result.stdout).toContain('FAIL E2E_DATABASE_URL')
    expect(result.stdout).not.toContain('postgresql://')
  })
})
