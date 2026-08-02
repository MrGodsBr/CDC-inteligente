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
            content: `Você é um assistente jurídico especialista no Código de Defesa do Consumidor (CDC) do Brasil.
Sua função é:
1. Identificar o número do artigo (entre 1 e 119) aplicável à dúvida ou pesquisa do usuário.
2. NUNCA reescrever ou alterar o texto da lei original.
3. Se houver alguma atualização legal recente, jurisprudência do STJ/STF (ex: súmulas) ou aplicação prática importante que NÃO consta na letra fria da lei, forneça em 'acrescimo_ia'. Se não houver acréscimo necessário, deixe 'acrescimo_ia' como string vazia "".

Responda ESTRITAMENTE em JSON no seguinte formato:
{
  "resultados": [
    {
      "id": "18",
      "title": "Artigo 18",
      "snippet": "Responsabilidade por vício de qualidade do produto e prazos para troca.",
      "acrescimo_ia": "Segundo o STJ (Súmula 543 e jurisprudência consolidada), em caso de produto essencial (como celular ou geladeira), o consumidor não precisa aguardar o prazo de 30 dias para exigir a troca imediata."
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
