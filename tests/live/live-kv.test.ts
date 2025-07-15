import { beforeEach, afterEach, describe, expect, it } from "vitest";

describe("Live KV Connectivity Test", () => {
  const testKeys: string[] = [];
  
  beforeEach(async () => {
    // Skip if not in live testing mode
    if (!globalThis.testKV) {
      return;
    }
    // Clear the test keys array for this test
    testKeys.length = 0;
  });

  afterEach(async () => {
    // Skip if not in live testing mode
    if (!globalThis.testKV) {
      return;
    }
    
    // Clean up all keys used in this test
    console.log(`🧹 Cleaning up ${testKeys.length} test keys from KV...`);
    for (const key of testKeys) {
      try {
        await globalThis.testKV.delete(key);
        console.log(`  ✅ Deleted KV key: ${key}`);
      } catch (error) {
        console.warn(`  ⚠️  Failed to delete KV key ${key}:`, error);
      }
    }
  });

  // Helper function to track keys for cleanup
  const trackKey = (key: string) => {
    testKeys.push(key);
    return key;
  };

  it("should be able to write and read from live KV", async () => {
    // Skip if not in live testing mode
    if (!globalThis.testKV) {
      console.log("⏭️  Skipping live KV test - not in live mode");
      return;
    }

    const testKey = trackKey(`test_connectivity_${Date.now()}`);
    const testValue = "Hello from live KV!";

    // Write to KV
    await globalThis.testKV.put(testKey, testValue);

    // Read from KV
    const result = await globalThis.testKV.get(testKey);

    expect(result).toBe(testValue);
  });

  it("should handle JSON data in live KV", async () => {
    // Skip if not in live testing mode
    if (!globalThis.testKV) {
      console.log("⏭️  Skipping live KV JSON test - not in live mode");
      return;
    }

    const testKey = trackKey(`test_json_data_${Date.now()}`);
    const testData = {
      userId: "test-123",
      email: "test@example.com",
      timestamp: new Date().toISOString(),
    };

    // Write JSON to KV
    await globalThis.testKV.put(testKey, JSON.stringify(testData));

    // Read JSON from KV with retry logic for eventual consistency
    let result = null;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts && result === null) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
      result = await globalThis.testKV.get(testKey, { type: "json" });
      attempts++;
    }

    expect(result).toEqual(testData);
  }, 60000); // Increase timeout for eventual consistency

  it("should return null for non-existent keys", async () => {
    // Skip if not in live testing mode
    if (!globalThis.testKV) {
      console.log("⏭️  Skipping live KV null test - not in live mode");
      return;
    }

    const result = await globalThis.testKV.get(`non_existent_key_${Date.now()}`);
    expect(result).toBeNull();
  });

  it("should be able to list keys with prefix", async () => {
    // Skip if not in live testing mode
    if (!globalThis.testKV) {
      console.log("⏭️  Skipping live KV list test - not in live mode");
      return;
    }

    const timestamp = Date.now();
    const prefix = `test_list_${timestamp}_`;
    
    // Set up test data with unique keys
    const key1 = trackKey(`${prefix}1`);
    const key2 = trackKey(`${prefix}2`);
    const otherKey = trackKey(`other_key_${timestamp}`);
    
    await globalThis.testKV.put(key1, "value1");
    await globalThis.testKV.put(key2, "value2");
    await globalThis.testKV.put(otherKey, "other_value");

    // List keys with prefix
    const result = await globalThis.testKV.list({ prefix });

    expect(result.keys).toHaveLength(2);
    expect(result.keys.map((k) => k.name)).toContain(key1);
    expect(result.keys.map((k) => k.name)).toContain(key2);
    expect(result.keys.map((k) => k.name)).not.toContain(otherKey);
  });
});
