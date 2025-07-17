import { execSync } from "node:child_process";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createTestR2Bucket, deleteTestR2Bucket } from "../utils/test-resources";

/**
 * Example test demonstrating proper R2 bucket lifecycle management
 * This shows how to avoid the "bucket already exists" error you encountered
 */
describe("R2 Bucket Lifecycle Management", () => {
  let testBucketName: string;

  beforeEach(async () => {
    // Create a unique bucket for each test
    testBucketName = await createTestR2Bucket("godwear-assets");
    console.log(`🧪 Test using bucket: ${testBucketName}`);
  });

  afterEach(async () => {
    // Clean up the bucket after each test
    if (testBucketName) {
      try {
        await deleteTestR2Bucket(testBucketName);
        console.log(`🧹 Cleaned up bucket: ${testBucketName}`);
      } catch (error) {
        console.warn(`Failed to cleanup bucket ${testBucketName}:`, error);
      }
    }
  });

  test("should create and use R2 bucket successfully", async () => {
    // Test that the bucket exists and can be used
    expect(testBucketName).toBeTruthy();
    expect(testBucketName).toMatch(/^godwear-assets-test-/);

    // Try to upload a test file
    const testContent = "Hello, R2 test!";
    const testKey = "test-file.txt";

    // Upload using wrangler CLI
    execSync(`echo "${testContent}" | wrangler r2 object put ${testBucketName}/${testKey} --pipe`, {
      stdio: "pipe",
      timeout: 30000,
    });

    // Verify the file was uploaded by downloading it
    const downloadedContent = execSync(
      `wrangler r2 object get ${testBucketName}/${testKey} --pipe`,
      {
        encoding: "utf8",
        stdio: "pipe",
        timeout: 30000,
      }
    );

    expect(downloadedContent.trim()).toBe(testContent);
  });

  test("should handle multiple files in bucket", async () => {
    const files = [
      { key: "file1.txt", content: "Content 1" },
      { key: "file2.txt", content: "Content 2" },
      { key: "nested/file3.txt", content: "Content 3" },
    ];

    // Upload multiple files
    for (const file of files) {
      execSync(
        `echo "${file.content}" | wrangler r2 object put ${testBucketName}/${file.key} --pipe`,
        {
          stdio: "pipe",
          timeout: 30000,
        }
      );
    }

    // Verify all files exist by downloading them
    for (const file of files) {
      const downloadedContent = execSync(
        `wrangler r2 object get ${testBucketName}/${file.key} --pipe`,
        {
          encoding: "utf8",
          stdio: "pipe",
          timeout: 30000,
        }
      );

      expect(downloadedContent.trim()).toBe(file.content);
    }
  });

  test("should handle bucket operations without conflicts", async () => {
    // This test demonstrates that each test gets its own bucket
    // so there are no conflicts between parallel test runs

    const uniqueContent = `Test content ${Date.now()}`;
    const testKey = "conflict-test.txt";

    // Upload content
    execSync(
      `echo "${uniqueContent}" | wrangler r2 object put ${testBucketName}/${testKey} --pipe`,
      {
        stdio: "pipe",
        timeout: 30000,
      }
    );

    // Download and verify
    const downloadedContent = execSync(
      `wrangler r2 object get ${testBucketName}/${testKey} --pipe`,
      {
        encoding: "utf8",
        stdio: "pipe",
        timeout: 30000,
      }
    );

    expect(downloadedContent.trim()).toBe(uniqueContent);

    // Delete the file
    execSync(`wrangler r2 object delete ${testBucketName}/${testKey}`, {
      stdio: "pipe",
      timeout: 30000,
    });

    // Verify file is deleted (this should fail)
    expect(() => {
      execSync(`wrangler r2 object get ${testBucketName}/${testKey} --pipe`, {
        stdio: "pipe",
        timeout: 30000,
      });
    }).toThrow();
  });
});

/**
 * Example of a test suite that manages its own bucket lifecycle
 * for tests that need to share state across multiple test cases
 */
describe("Shared R2 Bucket Tests", () => {
  let sharedBucketName: string;

  beforeAll(async () => {
    // Create one bucket for the entire test suite
    sharedBucketName = await createTestR2Bucket("godwear-shared");
    console.log(`🧪 Test suite using shared bucket: ${sharedBucketName}`);
  });

  afterAll(async () => {
    // Clean up the shared bucket after all tests
    if (sharedBucketName) {
      try {
        await deleteTestR2Bucket(sharedBucketName);
        console.log(`🧹 Cleaned up shared bucket: ${sharedBucketName}`);
      } catch (error) {
        console.warn(`Failed to cleanup shared bucket ${sharedBucketName}:`, error);
      }
    }
  });

  test("should upload file to shared bucket", async () => {
    const testContent = "Shared bucket content 1";
    const testKey = "shared-file-1.txt";

    execSync(
      `echo "${testContent}" | wrangler r2 object put ${sharedBucketName}/${testKey} --pipe`,
      {
        stdio: "pipe",
        timeout: 30000,
      }
    );

    const downloadedContent = execSync(
      `wrangler r2 object get ${sharedBucketName}/${testKey} --pipe`,
      {
        encoding: "utf8",
        stdio: "pipe",
        timeout: 30000,
      }
    );

    expect(downloadedContent.trim()).toBe(testContent);
  });

  test("should see file from previous test", async () => {
    // This test can see the file uploaded in the previous test
    // because they share the same bucket

    const downloadedContent = execSync(
      `wrangler r2 object get ${sharedBucketName}/shared-file-1.txt --pipe`,
      {
        encoding: "utf8",
        stdio: "pipe",
        timeout: 30000,
      }
    );

    expect(downloadedContent.trim()).toBe("Shared bucket content 1");
  });
});
