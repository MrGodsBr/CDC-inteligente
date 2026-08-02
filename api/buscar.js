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
            content: `Você é uma base jurídica estrita do Código de Defesa do Consumidor (CDC) do Brasil.
SUA REGRA PRINCIPAL: NUNCA RESUMA, NUNCA PARAFRASEIE E NUNCA USE INGLÊS.
Você deve retornar o texto OFICIAL E COMPLETO do artigo solicitado, incluindo Caput, Parágrafos (§), Incisos (I, II) e Alíneas (a, b), idêntico ao texto da Lei 8.078/1990.

Formate o texto em HTML usando <strong> para destacar o número do artigo e os parágrafos, e <br><br> para quebrar as linhas.

Formato da resposta obrigatoriamente em JSON:
{
  "resultados": [
    {
      "id": "37",
      "title": "Artigo 37",
      "snippet": "<strong>Art. 37.</strong> É proibida toda publicidade enganosa ou abusiva.<br><br><strong>§ 1º</strong> É enganosa qualquer modalidade de informação ou comunicação de caráter publicitário, inteira ou parcialmente falsa, ou, por qualquer outro modo, mesmo por omissão, capaz de induzir em erro o consumidor a respeito da natureza, características, qualidade, quantidade, propriedades, origem, preço e quaisquer outros dados sobre produtos e serviços.<br><br><strong>§ 2º</strong> É abusiva, dentre outras a publicidade discriminatória de qualquer natureza, a que incite à violência, explore o medo ou a superstição, se aproveite da deficiência de julgamento e experiência da criança, desrespeita valores ambientais, ou que seja capaz de induzir o consumidor a se comportar de forma prejudicial ou perigosa à sua saúde ou segurança.<br><br><strong>§ 3º</strong> Para os efeitos deste código, a publicidade é enganosa por omissão quando deixar de informar sobre dado essencial do produto ou serviço.<br><br><strong>§ 4º</strong> (Vetado)."
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
