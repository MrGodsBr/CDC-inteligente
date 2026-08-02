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
            content: `Você é um classificador jurídico do Código de Defesa do Consumidor (CDC) do Brasil.
Sua ÚNICA função é identificar quais números de artigos do CDC (de 1 a 119) correspondem à dúvida ou ao número pesquisado pelo usuário.
NUNCA invente o texto dos artigos.

Responda ESTRITAMENTE em formato JSON com o número do artigo em 'id' e uma breve justificativa da relação em 'snippet':
{
  "resultados": [
    {
      "id": "18",
      "title": "Artigo 18",
      "snippet": "Trata da responsabilidade por vício de qualidade e prazo para sanar defeitos."
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
