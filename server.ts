import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

// Helper to reliably parse JSON returned by Gemini (removing code blocks if present)
function cleanAndParseJson(rawText: string | undefined): any {
  if (!rawText) return {};
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Attempt regex extraction for a JSON object or array
    const match = cleaned.match(/\{[\s\S]*\}/) || cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e) {
        // Fall through
      }
    }
    throw new Error("A resposta gerada pela IA não está em formato JSON válido.");
  }
}

// Initialize Google GenAI client lazily or when API key is present
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("A chave GEMINI_API_KEY não foi configurada nos Segredos (Secrets).");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API Routes
app.get("/api/health", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Endpoint: AI Material Estimator (Calculadora de Insumos da Obra)
app.post("/api/ai/estimate-mix", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const { taskType, dimensions, specs, notes } = req.body || {};
    const ai = getGenAI();

    const prompt = `Você é um engenheiro civil sênior especialista em orçamento e quantificação de materiais/insumos para construção civil no Brasil.
Calcule detalhadamente a lista de insumos necessários para a seguinte especificação de obra:

Tipo de Serviço: ${taskType || "Concretagem / Alvenaria"}
Dimensões/Volume/Área: ${dimensions}
Especificações Técnicas: ${specs || "Padrão de mercado NBR"}
Observações do Canteiro: ${notes || "Nenhuma"}

Responda ESTRITAMENTE em formato JSON com o seguinte schema:
{
  "summary": "Resumo técnico da estimativa em português com recomendações de boas práticas",
  "items": [
    {
      "name": "Nome padronizado do insumo (ex: Cimento CP II-F 32 - Saco 50kg, Areia Média, Brita 1, Aço CA-50 10mm, Argamassa ACIII)",
      "category": "Uma entre: Cimento e Agregados, Aço e Estrutura, Alvenaria e Blocos, Argamassas e Selantes, Tubos e Conexões, Pintura e Acabamento, Madeiras e Fôrmas, Elétrica, Cobertura, Outros",
      "quantity": 0.0,
      "unit": "Saco 50kg | m³ | kg | Barra 12m | Unidade | Lata 18L",
      "estimatedUnitPrice": 0.0,
      "notes": "Dica de armazenagem ou perdas (ex: considerar 5% de quebra)"
    }
  ],
  "safetyLossMarginPct": 5.0
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const data = cleanAndParseJson(response.text);
    return res.json({ success: true, data });
  } catch (err: any) {
    console.error("Erro na estimativa IA:", err);
    return res.status(500).json({ success: false, error: err.message || "Erro ao processar estimativa com IA" });
  }
});

// Endpoint: AI Invoice / Receipt Parser (Leitor de Nota Fiscal / Comprovante de Entrega)
app.post("/api/ai/parse-invoice", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const { rawText, imageBase64 } = req.body || {};
    const ai = getGenAI();

    let parts: any[] = [];
    if (imageBase64) {
      let mimeType = "image/jpeg";
      const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
      parts.push({
        inlineData: {
          mimeType,
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
        },
      });
    }

    const textPrompt = `Você é um assistente especialista em almoxarifado de obra. Analise a imagem/texto do romaneio, nota fiscal (NF-e) ou comprovante de entrega de materiais de construção abaixo e extraia todos os insumos.

Texto adicional / Observações: ${rawText || "Extrair itens do comprovante"}

Retorne ESTRITAMENTE em formato JSON com o schema:
{
  "supplier": "Nome do Fornecedor / Depósito",
  "invoiceNumber": "Número da NF ou Romaneio se visível",
  "date": "YYYY-MM-DD se visível ou null",
  "items": [
    {
      "name": "Nome claro do material (ex: Areia Média Lavada, Cimento Votoran CP II 50kg, Vergalhão 3/8 CA-50)",
      "category": "Cimento e Agregados | Aço e Estrutura | Alvenaria e Blocos | Argamassas e Selantes | Tubos e Conexões | Pintura e Acabamento | Madeiras e Fôrmas | Elétrica | Cobertura | Outros",
      "quantity": 0.0,
      "unit": "m³ | Saco 50kg | kg | Barra 12m | Unidade | Lata 18L | M3",
      "unitPrice": 0.0,
      "totalPrice": 0.0,
      "batchCode": "Número de lote/série se houver ou string vazia",
      "location": "Almoxarifado Principal | Canteiro Principal"
    }
  ]
}`;

    parts.push({ text: textPrompt });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
      },
    });

    const data = cleanAndParseJson(response.text);
    return res.json({ success: true, data });
  } catch (err: any) {
    console.error("Erro no leitor NF IA:", err);
    return res.status(500).json({ success: false, error: err.message || "Erro ao ler comprovante com IA" });
  }
});

// Endpoint: AI Stock Health & Waste Audit (Análise Inteligente de Riscos de Estoque)
app.post("/api/ai/analyze-stock", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const { items, activeWorks } = req.body || {};
    const ai = getGenAI();

    const prompt = `Atue como Engenheiro de Gestão de Materiais de Construção Civil.
Analise a seguinte lista de insumos em estoque e obras ativas:

Estoque Atual: ${JSON.stringify(items || [])}
Obras/Canteiros Ativos: ${JSON.stringify(activeWorks || [])}

Identifique:
1. Materiais com risco de escassez (abaixo do estoque mínimo ou demanda iminente).
2. Riscos de perda por umidade, prazo de validade (cimento, gesso, adesivos).
3. Sugestões de compras/cotação emergencial.
4. Dicas de logística interna para evitar avarias e desperdício no canteiro.

Responda ESTRITAMENTE em formato JSON com o schema:
{
  "criticalAlerts": [
    {
      "materialName": "Nome do Insumo",
      "issue": "Descrição do problema / risco",
      "severity": "Alta | Média | Baixa",
      "recommendedAction": "Ação imediata recomendada"
    }
  ],
  "purchasingSuggestions": [
    {
      "materialName": "Nome",
      "suggestedQty": 0.0,
      "unit": "Unidade",
      "urgencyReason": "Motivo da sugestão"
    }
  ],
  "storageOptimizationTips": [
    "Dica prática de armazenamento para o almoxarife"
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const data = cleanAndParseJson(response.text);
    return res.json({ success: true, data });
  } catch (err: any) {
    console.error("Erro na análise de estoque IA:", err);
    return res.status(500).json({ success: false, error: err.message || "Erro ao analisar estoque com IA" });
  }
});

// Setup Vite Development Middleware or Production Static Server
async function startServer() {
  const distPath = path.join(process.cwd(), "dist");
  const publicPath = path.join(process.cwd(), "public");

  // Serve static files from public directory if present
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }

  // Serve static files from dist directory if present
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api/")) {
        return res.status(404).json({ error: "API route not found" });
      }
      if (req.path.startsWith("/assets/") || /\.(js|css|png|jpg|jpeg|webp|svg|ico|json|woff2?)$/i.test(req.path)) {
        return res.status(404).send("Asset not found");
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server de Controle de Estoque rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer();
