// Re-export live testing utilities as the default test utilities
// This replaces the previous mock-based implementation

export * from "./live-test-utils";

// For backward compatibility, provide aliases
export {
  createLiveEmailTestEnvironment as createEmailTestEnvironment,
  liveEmailAssertions as emailAssertions,
  LiveEmailTestEnvironment as EmailTestEnvironment,
} from "./live-test-utils";

// Legacy mock functions - now redirect to live testing with warnings
export function simulateEmailEvents(...args: any[]): Promise<void> {
  console.warn("⚠️  simulateEmailEvents is deprecated in live testing mode");
  console.warn("   Real email events will be tracked automatically");
  return Promise.resolve();
}

// Remove mock imports and dependencies
console.log("🚀 Email testing utilities loaded in LIVE MODE");
console.log("📧 All emails will be sent to: njordrenterprises@gmail.com");
console.log("⏱️  Queue configured for 1-minute intervals between emails");
