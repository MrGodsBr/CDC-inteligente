export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ erro: 'Termo de busca é obrigatório' });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `Você é um advogado especialista no Código de Defesa do Consumidor (CDC) do Brasil.
Sua tarefa é fornecer uma breve análise prática, explicação jurídica simples e aplicação real sobre a consulta do usuário.

REGRAS:
1. Retorne no campo 'explicacao_ia' um texto bem estruturado de 2 a 4 frases explicando como esse artigo funciona na prática para o consumidor.
2. Em 'id', coloque o número do artigo consultado (ex: "58").

Responda ESTRITAMENTE em formato JSON:
{
  "resultados": [
    {
      "id": "58",
      "explicacao_ia": "Este artigo trata das sanções administrativas aplicadas pelos órgãos de proteção (como o PROCON) quando um produto ou serviço apresenta vícios ou riscos. As penalidades incluem desde a apreensão até a suspensão da fabricação, garantindo sempre a ampla defesa do fornecedor."
    }
  ]
}`
          },
          {
            role: "user",
            content: query
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("Erro Groq:", data.error);
      return res.status(500).json({ erro: "Erro na resposta da IA." });
    }

    const resultado = JSON.parse(data.choices[0].message.content);
    return res.status(200).json(resultado);

  } catch (erro) {
    console.error("Erro no servidor:", erro);
    return res.status(500).json({ erro: "Falha ao processar a busca com IA." });
  }
}
