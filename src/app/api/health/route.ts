import { NextResponse } from 'next/server';
import { pool } from '@/lib/db/pool';

export async function GET() {
  try {
    const result = await pool.query('SELECT 1 AS healthy');
    return NextResponse.json({
      status: 'ok',
      db: result.rows[0]?.healthy === 1 ? 'connected' : 'unknown',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Database connection error',
      },
      { status: 500 }
    );
  }
}
