import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { query } from '../api/lib/db.js'

async function migrate() {
  try {
    console.log('Running database migrations...')

    const schemaPath = path.join(process.cwd(), 'db', 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')

    // Split by semicolons and filter empty statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 50) + '...')
      await query(statement)
    }

    console.log('✓ Database migrations completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('✗ Migration failed:', error)
    process.exit(1)
  }
}

migrate()
