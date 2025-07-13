import honox from "honox/vite";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  if (mode === "client") {
    return {
      build: {
        rollupOptions: {
          input: ["./app/client.ts"],
          output: {
            entryFileNames: "static/client.[hash].js",
            chunkFileNames: "static/assets/[name].[hash].js",
            assetFileNames: "static/assets/[name].[hash][extname]",
          },
        },
      },
    };
  }

  return {
    plugins: [honox()],
    build: {
      ssr: true,
      rollupOptions: {
        input: "./app/entry.server.ts",
        output: {
          entryFileNames: "_worker.js",
          format: "es",
        },
      },
    },
  };
});
