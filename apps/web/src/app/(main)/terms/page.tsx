import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Termos de uso" };

export default function TermsPage() {
  return (
    <LegalPage title="Termos de uso" updated="9 de novembro de 2026">
      <p>
        O HoneyMoney é um software livre e gratuito (licença AGPL-3.0) que ajuda você a criar ofertas de produtos digitais
        com agentes de IA. Ao usar esta instância, você concorda com estes termos.
      </p>
      <h2>Quem pode usar</h2>
      <p>Somente maiores de 18 anos.</p>
      <h2>O que o HoneyMoney faz e não faz</h2>
      <ul>
        <li>Ajuda a criar produto, página de vendas e textos para um produto digital próprio.</li>
        <li>Não promete nem estima renda, faturamento ou resultados.</li>
        <li>
          Não pode ser usado para trading, opções binárias, apostas, sinais de investimento, pirâmides ou esquemas de
          “sócio”, nem para alegações de cura, emagrecimento milagroso ou renda garantida.
        </li>
        <li>Não vende ofertas de terceiros e não intermedeia pagamentos. O checkout é seu, no provedor que você escolher.</li>
      </ul>
      <h2>Sua responsabilidade</h2>
      <p>
        O conteúdo gerado é uma sugestão. Você revisa, edita e decide o que publicar, e é responsável pelo que publica e
        vende, inclusive pelo cumprimento do Código de Defesa do Consumidor (como o direito de arrependimento de 7 dias em
        compras on-line).
      </p>
      <h2>Chaves de IA e custos</h2>
      <p>
        Se você usar sua própria chave, o provedor de IA cobra você diretamente pelo uso. O modelo gratuito da instância,
        quando existir, tem limite diário e pode ser alterado ou desligado.
      </p>
      <h2>Páginas publicadas</h2>
      <p>
        Podemos despublicar páginas que violem estes termos ou a lei. Páginas publicadas mostram que foram criadas com o
        HoneyMoney.
      </p>
      <h2>Sem garantia</h2>
      <p>O software é fornecido “como está”, sem garantias, conforme a licença AGPL-3.0.</p>
    </LegalPage>
  );
}
