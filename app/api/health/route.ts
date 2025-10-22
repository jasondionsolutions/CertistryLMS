import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

/**
 * Health Check Endpoint
 *
 * Returns system status, database connectivity, and environment info
 * Used by monitoring tools and Vercel for deployment verification
 *
 * GET /api/health
 */
export async function GET() {
  const startTime = Date.now()
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    version: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'local',
    database: {
      status: 'unknown',
      latency: 0,
    },
    services: {
      cognito: process.env.COGNITO_USER_POOL_ID ? 'configured' : 'not configured',
      s3: process.env.AWS_S3_BUCKET_NAME ? 'configured' : 'not configured',
    },
  }

  // Check database connectivity
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbEnd = Date.now()

    healthCheck.database.status = 'connected'
    healthCheck.database.latency = dbEnd - dbStart
  } catch (error) {
    healthCheck.status = 'degraded'
    healthCheck.database.status = 'disconnected'

    console.error('Health check database error:', error)
  } finally {
    await prisma.$disconnect()
  }

  const responseTime = Date.now() - startTime

  return NextResponse.json(
    {
      ...healthCheck,
      responseTime,
    },
    {
      status: healthCheck.status === 'ok' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  )
}
