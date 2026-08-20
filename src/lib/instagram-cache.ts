import { createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

type CacheRow = {
  result_status: 'success' | 'not_found'
  payload: unknown
}

export function instagramProfileCacheKey(handle: string): string {
  return createHash('sha256')
    .update(`/profile:${handle.trim().toLowerCase()}`)
    .digest('hex')
}

export async function readInstagramProfileCache(cacheKey: string): Promise<unknown | null> {
  try {
    const supabaseAdmin = createAdminClient()
    const { data, error } = await supabaseAdmin.rpc('consume_instagram_api_cache', {
      p_cache_key: cacheKey,
    })
    if (error) {
      console.error('Instagram cache read error:', error.message)
      return null
    }
    const row = (data?.[0] ?? null) as CacheRow | null
    return row?.result_status === 'success' ? row.payload : null
  } catch (error) {
    // O cache é uma otimização; falha nele não derruba a atualização real.
    console.error('Instagram cache read error:', error)
    return null
  }
}

export async function writeInstagramProfileCache(options: {
  cacheKey: string
  handle: string
  payload: unknown
  ttlMs: number
}): Promise<void> {
  try {
    const supabaseAdmin = createAdminClient()
    const now = new Date()
    const { error } = await supabaseAdmin.from('instagram_api_cache').upsert(
      {
        cache_key: options.cacheKey,
        endpoint: '/profile',
        request_params: { username: options.handle.trim().toLowerCase() },
        result_status: 'success',
        payload: options.payload,
        source: 'gestao-apruma',
        fetched_at: now.toISOString(),
        expires_at: new Date(now.getTime() + options.ttlMs).toISOString(),
        hit_count: 0,
        last_hit_at: null,
      },
      { onConflict: 'cache_key' }
    )
    if (error) console.error('Instagram cache write error:', error.message)
  } catch (error) {
    console.error('Instagram cache write error:', error)
  }
}
