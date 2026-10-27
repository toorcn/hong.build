import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static: deployed to Cloudflare Workers static assets (see wrangler.jsonc).
  output: "export",
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  // The dev indicator's default bottom-left slot is where PanelAnchor lives.
  devIndicators: {
    position: "bottom-right",
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);
