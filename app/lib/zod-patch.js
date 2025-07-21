/**
 * Zod Patch
 *
 * This file previously applied the Zod v4 compatibility monkey patch globally.
 * However, the monkey patching approach has been removed in favor of using
 * the compatibility functions directly.
 *
 * This file is kept for backward compatibility but no longer performs any patching.
 */
// Export a dummy function to ensure the file is not tree-shaken
export function ensureZodPatchIsApplied() {
    // This function does nothing but ensures the file is imported
    console.warn('Zod patch is no longer needed. Use the compatibility functions from zod-compat.ts instead.');
    return true;
}
//# sourceMappingURL=zod-patch.js.map