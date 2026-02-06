// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import mermaid from "astro-mermaid";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  integrations: [
    mermaid({
      theme: "base",
      autoTheme: true,
      mermaidConfig: {
        themeVariables: {
          fontSize: "1.2rem",
          fontFamily: "inherit",
          padding: 16, // node padding
          nodePadding: 16,
        },
        flowchart: {
          nodeSpacing: 60, // space between nodes horizontally
          rankSpacing: 60, // space between ranks vertically
          htmlLabels: true, // ensures <br/> labels behave
        },
      },
    }),
    starlight({
      title: "Adopting Stability",
      social: [],
      sidebar: [
        {
          label: "Foundations",
          items: [
            // Each item here is one entry in the navigation menu.
            { label: "Installing", slug: "foundations/installing" },
            { label: "Motivation", slug: "foundations/motivation" },
            { label: "What", slug: "foundations/what-is-nix" },
          ],
        },
        {
          label: "Core Concepts",
          items: ["store-and-derivations", "purity-and-language"],
        },
        {
          label: "Practical Usage",
          items: ["using-nix"],
        },
        {
          label: "Language",
          items: ["primer", "language-practice"],
        },
        {
          label: "Building & Packaging",
          items: ["flakes", "builds-and-derivations"],
        },
        // {
        //   label: "Systems & Deployment",
        //   items: [
        //     "nixos-overview",
        //     "custom-modules",
        //     "kubernetes",
        //     "terraform",
        //   ],
        // },
        // {
        //   label: "Tradeoffs & Adoption",
        //   items: ["incremental-adoption"],
        // },
        // {
        //   label: "Next Steps",
        //   items: ["where-to-go-next"],
        // },
      ],
    }),
  ],
  adapter: cloudflare({
    platformProxy: { enabled: true },
  }),
});
