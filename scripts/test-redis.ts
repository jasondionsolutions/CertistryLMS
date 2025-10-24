/**
 * Redis Connection Test Script
 *
 * Tests Upstash Redis connection to verify it's working properly
 */

import { Queue } from "bullmq";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env" });

async function testRedisConnection() {
  console.log("🔍 Testing Upstash Redis connection...");
  console.log("Redis URL:", process.env.UPSTASH_REDIS_URL?.substring(0, 30) + "...");

  try {
    // Create a test queue with timeout settings
    const testQueue = new Queue("test-connection", {
      connection: {
        url: process.env.UPSTASH_REDIS_URL,
        tls: process.env.UPSTASH_REDIS_URL?.includes('upstash') ? {} : undefined,
        connectTimeout: 5000,
        commandTimeout: 5000,
        maxRetriesPerRequest: 1,
      },
    });

    console.log("✅ Queue instance created");

    // Try to add a simple job with timeout
    const jobPromise = testQueue.add("test-job", { message: "Hello Redis!" });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Connection timeout after 10 seconds")), 10000)
    );

    const job = await Promise.race([jobPromise, timeoutPromise]) as any;

    console.log("✅ Job added successfully:", job.id);

    // Try to retrieve the job
    const retrievedJob = await testQueue.getJob(job.id);
    console.log("✅ Job retrieved successfully:", retrievedJob?.data);

    // Clean up
    await testQueue.close();
    console.log("✅ Connection closed");

    console.log("\n🎉 Redis connection test PASSED!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Redis connection test FAILED:");
    console.error(error);
    process.exit(1);
  }
}

testRedisConnection();
