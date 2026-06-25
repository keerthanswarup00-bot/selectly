import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app/", "/api/", "/share/"],
    },
    sitemap: "https://selixo.app/sitemap.xml",
  }
}
