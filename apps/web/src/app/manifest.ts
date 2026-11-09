import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "HoneyMoney",
    short_name: "HoneyMoney",
    description: "Crie sua oferta digital do zero com uma equipe de agentes de IA. Grátis e open source.",
    lang: "pt-BR",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#fffdf7",
    theme_color: "#f59e0b",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Nova oferta", url: "/app/projects/new", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Projetos", url: "/app", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
