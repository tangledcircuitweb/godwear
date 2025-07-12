import { createRoute } from 'honox/factory'

// Example route demonstrating KV and D1 usage with proper types
export default createRoute(async (c) => {
  const { GODWEAR_KV, DB } = c.env

  try {
    // Example KV operations
    await GODWEAR_KV.put('example-key', JSON.stringify({
      message: 'Hello from GodWear!',
      timestamp: new Date().toISOString()
    }))

    const kvValue = await GODWEAR_KV.get('example-key', 'json')

    // Example D1 operations
    const stmt = DB.prepare('SELECT 1 as test_value')
    const result = await stmt.first()

    return c.json({
      success: true,
      kv: kvValue,
      db: result,
      message: 'Cloudflare bindings are working!'
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})
