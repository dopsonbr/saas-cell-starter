import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const value = (flag) => {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : undefined
}

const name = value('--name')
const slug = value('--slug')
if (!name || !slug) {
  console.error(
    'Usage: pnpm init:project -- --name "Product Name" --slug product-slug',
  )
  process.exit(1)
}
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error('--slug must be lowercase kebab-case')
  process.exit(1)
}

const root = process.cwd()
const replacements = new Map([
  ['SaaS Cell Starter', name],
  ['saas-cell-starter', slug],
  ['@starter/', `@${slug}/`],
])
const ignored = new Set(['node_modules', '.git', 'dist', '.vercel'])

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (
      /\.(md|json|ya?ml|ts|tsx|js|mjs|css|html|example)$/.test(entry.name) ||
      entry.name === 'AGENTS.md'
    ) {
      let text = fs.readFileSync(full, 'utf8')
      for (const [from, to] of replacements) text = text.split(from).join(to)
      fs.writeFileSync(full, text)
    }
  }
}

walk(root)
console.log(
  `Initialized ${name} (${slug}). Review docs/product.md and commit the baseline before feature work.`,
)
