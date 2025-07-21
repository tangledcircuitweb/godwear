// Export email service interfaces and types
export * from "./email-service";

// Export concrete implementations
export * from "./mailersend-service";
export * from "./test-service";
export * from "./transactional-email-service";
export * from "./email-queue-service";

// Export utility functions
export * from "../utils/template-engine";
export * from "../utils/personalization";
export * from "../utils/tracking";
