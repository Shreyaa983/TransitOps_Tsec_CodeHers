import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig(async ({ command, mode }): Promise<UserConfig> => {
  const plugins: UserConfig["plugins"] = [];

  // TailwindCSS
  plugins.push(tailwindcss());

  // TypeScript path resolution
  plugins.push(tsConfigPaths({ projects: ["./tsconfig.json"] }));

  // TanStack Start (SSR + routing)
  plugins.push(
    tanstackStart({
      server: { entry: "server" },
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
    }),
  );

  // Nitro build plugin (production deploy)
  if (command === "build") {
    try {
      const { nitro } = await import("nitro/vite");
      plugins.push(
        nitro({
          defaultPreset: "cloudflare-module",
        }),
      );
    } catch {
      // nitro not available, skip
    }
  }

  // React
  plugins.push(react());

  const isDevBuild = command === "build" && mode === "development";

  return {
    plugins,
    ...(isDevBuild
      ? {
          environments: {
            client: {
              define: { "process.env.NODE_ENV": JSON.stringify("development") },
            },
          },
        }
      : {}),
    css: { transformer: "lightningcss" },
    resolve: {
      alias: {
        "@": `${process.cwd()}/src`,
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "lottie-react",
      ],
      ignoreOutdatedRequests: true,
    },
    server: {
      fs: {
        allow: [".."],
      },
      host: "::",
      port: 8080,
      watch: {
        awaitWriteFinish: {
          stabilityThreshold: 1000,
          pollInterval: 100,
        },
      },
    },
  };
});
