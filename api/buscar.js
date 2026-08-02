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
            content: `Você é um indexador especialista no Código de Defesa do Consumidor (CDC) do Brasil.
SUAS REGRAS ABSOLUTAS:
1. Retorne APENAS o número do artigo (entre 1 e 119) aplicável à dúvida do usuário em 'id'.
2. NUNCA escreva ou tente reproduzir o texto do artigo. O texto original é lido diretamente do arquivo cdc.json.
3. Se houver alguma Súmula do STJ/STF, jurisprudência recente ou esclarecimento prático importante sobre essa dúvida, escreva em 'acrescimo_ia'. Se não houver nada a acrescentar, deixe 'acrescimo_ia' como "".

Formato da resposta JSON:
{
  "resultados": [
    {
      "id": "37",
      "snippet": "Regula a publicidade enganosa e abusiva.",
      "acrescimo_ia": "O STJ entende que a publicidade enganosa gera responsabilidade objetiva do anunciante e do veículo se houver má-fé."
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
