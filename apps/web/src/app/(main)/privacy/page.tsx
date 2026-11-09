import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidade" updated="9 de novembro de 2026">
      <p>
        Esta política explica quais dados esta instância do HoneyMoney trata e como você exerce seus direitos pela Lei
        Geral de Proteção de Dados (LGPD).
      </p>
      <h2>Dados que guardamos</h2>
      <ul>
        <li>Conta: e-mail, nome (opcional), idioma e confirmação de maioridade.</li>
        <li>Projetos: briefing, entregas dos agentes, versões da oferta e páginas.</li>
        <li>Chaves de IA: guardadas criptografadas no Supabase Vault. Mostramos apenas os últimos 4 dígitos.</li>
        <li>Registros técnicos de cada execução de agente (status, tokens usados e erros, sem as chaves).</li>
      </ul>
      <h2>Provedores de IA</h2>
      <p>
        Para gerar sua oferta, o briefing e as entregas anteriores são enviados ao provedor de IA escolhido no projeto:
        Google (Gemini), OpenAI ou Anthropic (Claude). Cada provedor tem sua própria política de privacidade. Não envie
        dados pessoais de terceiros no briefing.
      </p>
      <h2>Outros operadores</h2>
      <ul>
        <li>Supabase: banco de dados, login e armazenamento.</li>
        <li>Vercel: hospedagem do app.</li>
        <li>Inngest: fila que executa os agentes.</li>
        <li>PostHog: analytics, somente se você aceitar no aviso de consentimento.</li>
      </ul>
      <h2>Seus direitos</h2>
      <p>
        Em Configurações você pode exportar todos os seus dados em JSON e excluir sua conta, o que apaga projetos, páginas
        e chaves de IA de forma definitiva. Para outras solicitações, abra uma issue no repositório ou contate a pessoa que
        mantém esta instância.
      </p>
      <h2>Cookies</h2>
      <p>
        Usamos apenas cookies necessários para manter você conectada(o). Cookies de analytics só são usados com o seu
        consentimento. Páginas publicadas ficam em um subdomínio separado e não recebem os cookies do app.
      </p>
    </LegalPage>
  );
}
