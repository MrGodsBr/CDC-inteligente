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
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Você é uma API de consulta oficial do Código de Defesa do Consumidor (Lei nº 8.078/1990) do Brasil.
Sua tarefa é retornar os artigos completos aplicáveis à busca do usuário.

REGRAS OBRIGATÓRIAS:
1. Retorne o texto VERDADEIRO e COMPLETO da Lei, sem resumir, sem omitir parágrafos (§), incisos (I, II) ou alíneas.
2. NUNCA invente texto legal.
3. Formate o campo 'texto' usando HTML (tags <p>, <strong> para o número do artigo/parágrafos, e <br>).

Formato ESTRITO de resposta em JSON:
{
  "resultados": [
    {
      "id": "42",
      "title": "Artigo 42",
      "snippet": "Resumo em 1 frase da aplicação do artigo.",
      "texto": "<strong>Art. 42.</strong> Na cobrança de débitos, o consumidor inadimplente não será exposto a ridículo, nem será submetido a qualquer tipo de constrangimento ou ameaça.<br><br><strong>Parágrafo único.</strong> O consumidor cobrado em quantia indevida tem direito à repetição do indébito, por valor igual ao dobro do que pagou em excesso, acrescido de correção monetária e juros legais, salvo hipótese de engano justificável."
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
