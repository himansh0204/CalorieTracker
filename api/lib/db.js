import pg from 'pg'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

pool.on('error', (err) => {
  console.error('[db] Unexpected pool error', err)
})

export async function query(text, params) {
  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[db]', { duration: Date.now() - start, rows: result.rowCount, text })
    }
    return result
  } catch (error) {
    console.error('[db] Query error', { error: error.message, text })
    throw error
  }
}

export async function getClient() {
  return pool.connect()
}

export default pool
