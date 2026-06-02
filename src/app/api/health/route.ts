import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Try a simple query to check if the database is accessible and schema is in sync
    await db.user.count()
    return NextResponse.json({ status: 'ok', database: 'connected' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    // Check if it's a schema mismatch error
    if (message.includes('does not exist')) {
      return NextResponse.json({
        status: 'error',
        database: 'schema_mismatch',
        message: 'Database schema is out of sync. Please run "bun run db:push" to update your database.',
        error: message,
      }, { status: 503 })
    }
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      message: 'Database connection failed.',
      error: message,
    }, { status: 503 })
  }
}
