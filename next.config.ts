import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static: deployed to Cloudflare Workers static assets (see wrangler.jsonc).
  output: "export",
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  // Static hosting has no image optimizer; chapter photos ship as-is.
  images: { unoptimized: true },
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
