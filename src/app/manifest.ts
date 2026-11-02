import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wesley",
    short_name: "Wesley",
    description: "Tasks, Termine, Jahrestage, News und Restaurants an einem Ort.",
    start_url: "/heute",
    display: "standalone",
    background_color: "#f6f4f1",
    theme_color: "#f26b12",
    lang: "de-CH",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
