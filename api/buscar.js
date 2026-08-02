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
            content: `Você é um consultor jurídico do Código de Defesa do Consumidor (CDC) do Brasil.
Sua função é analisar a DÚVIDA do usuário e indicar os artigos aplicáveis.

REGRAS RIGOROSAS:
1. NUNCA invente ou escreva o texto da lei. O texto da lei vem 100% do banco local cdc.json.
2. Em 'id', coloque o número do artigo (entre 1 e 119).
3. Em 'explicacao_ia', forneça uma orientação prática, curta e clara em linguagem simples explicando como o artigo se aplica ao problema relatado.

Formato ESTRITO da resposta em JSON:
{
  "resultados": [
    {
      "id": "18",
      "explicacao_ia": "Para produtos com defeito de fabricação, o fornecedor tem até 30 dias para resolver. Se não resolver, você tem direito à troca imediata ou reembolso."
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
