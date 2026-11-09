import type { AgentName } from "@honeymoney/agents";

export type AgentMeta = {
  name: string;
  title: string;
  deliverable: string;
  /** Shirt color, hair color, skin tone, accessory. Original characters for HoneyMoney. */
  look: { shirt: string; hair: string; skin: string; hairStyle: "bun" | "short" | "curly" | "long" | "cap" | "bald" };
  accessory: "clipboard" | "magnifier" | "chess" | "pen" | "palette" | "shield";
};

export const AGENT_META: Record<AgentName, AgentMeta> = {
  manager: {
    name: "Gerente",
    title: "Coordena a fila e conversa com você",
    deliverable: "Status do projeto",
    look: { shirt: "#f59e0b", hair: "#3f2a1d", skin: "#c68863", hairStyle: "bun" },
    accessory: "clipboard",
  },
  researcher: {
    name: "Pesquisadora",
    title: "Mapeia nicho, dores e objeções",
    deliverable: "Mapa de público",
    look: { shirt: "#0ea5e9", hair: "#1f1a17", skin: "#8d5a3b", hairStyle: "curly" },
    accessory: "magnifier",
  },
  strategist: {
    name: "Estrategista",
    title: "Define promessa, formato, preço e estrutura",
    deliverable: "Esqueleto da oferta",
    look: { shirt: "#8b5cf6", hair: "#6b4f2a", skin: "#f1c7a3", hairStyle: "short" },
    accessory: "chess",
  },
  copywriter: {
    name: "Copywriter",
    title: "Escreve headline, página, e-mails e anúncios",
    deliverable: "Copy completa",
    look: { shirt: "#f43f5e", hair: "#b45309", skin: "#e0a77f", hairStyle: "long" },
    accessory: "pen",
  },
  designer: {
    name: "Designer",
    title: "Monta a página em blocos",
    deliverable: "Página de vendas",
    look: { shirt: "#10b981", hair: "#111827", skin: "#a86b47", hairStyle: "cap" },
    accessory: "palette",
  },
  sentinel: {
    name: "Sentinela",
    title: "Revisa promessas, alegações e erros",
    deliverable: "Aprovação ou lista de ajustes",
    look: { shirt: "#475569", hair: "#9ca3af", skin: "#d6a284", hairStyle: "bald" },
    accessory: "shield",
  },
};
