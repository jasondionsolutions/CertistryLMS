/**
 * BullMQ Queue Configuration
 *
 * Shared configuration for Redis connection and queue options.
 */

import { ConnectionOptions } from "bullmq";

/**
 * Redis connection options for BullMQ
 * Uses Upstash Redis for serverless compatibility
 */
export const redisConnection: ConnectionOptions = {
  url: process.env.UPSTASH_REDIS_URL,
  // Upstash requires TLS
  tls: process.env.UPSTASH_REDIS_URL?.includes('upstash') ? {} : undefined,
};

/**
 * Default queue options
 */
export const defaultQueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential' as const,
      delay: 5000, // Start with 5 second delay, doubles each retry
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs for debugging
    },
    removeOnFail: {
      count: 50, // Keep last 50 failed jobs for debugging
    },
  },
};
