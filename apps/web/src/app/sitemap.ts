import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  return ["", "/demo", "/download", "/signup", "/terms", "/privacy"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.5,
  }));
}
