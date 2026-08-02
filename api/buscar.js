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

PROIBIÇÃO ABSOLUTA: NUNCA ESCREVA O TEXTO DO ARTIGO DO CDC. O TEXTO VEM DO CDC.JSON LOCAL.

Sua única função é:
1. Retornar em 'id' apenas o número do artigo do CDC (de 1 a 119) correspondente à dúvida.
2. Se houver alguma jurisprudência (ex: Súmulas do STJ/STF) ou atualização relevante, coloque em 'acrescimo_ia'. Se não houver nada a acrescentar, deixe em branco "".

Formato de resposta JSON:
{
  "resultados": [
    {
      "id": "37",
      "snippet": "Publicidade enganosa ou abusiva.",
      "acrescimo_ia": "Súmula do STJ ou entendimento consolidado (se aplicável)."
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
