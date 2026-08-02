export default async function handler(req, res) {
  /*
   * ============================================================
   * MÉTODO
   * ============================================================
   */
  if (req.method !== 'POST') {
    return res.status(405).json({
      erro: 'Método não permitido'
    });
  }
  /*
   * ============================================================
   * QUERY
   * ============================================================
   */
  const { query } = req.body || {};
  if (
    !query ||
    typeof query !== 'string' ||
    query.trim() === ''
  ) {
    return res.status(400).json({
      erro: 'Termo de busca é obrigatório'
    });
  }
  /*
   * ============================================================
   * CHAVE DA GROQ
   * ============================================================
   */
  if (!process.env.GROQ_API_KEY) {
    console.error(
      'GROQ_API_KEY não configurada.'
    );
    return res.status(500).json({
      erro: 'Chave da IA não configurada.'
    });
  }
  try {
    /*
     * ==========================================================
     * CONSULTA À GROQ
     * ==========================================================
     */
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization":
            `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          /*
           * Modelo rápido para análise da pergunta.
           */
          model: "llama-3.1-8b-instant",
          temperature: 0.1,
          messages: [
            {
              role: "system",
              content: `
Você é um assistente de pesquisa jurídica especializado no Código de Defesa do Consumidor (CDC) brasileiro.
IMPORTANTE:
O banco local cdc.json é a FONTE PRINCIPAL do aplicativo.
A IA NÃO é a fonte do texto da lei.
A IA NÃO deve escrever, reproduzir, reconstruir ou inventar o texto de nenhum artigo do CDC.
Sua função é SOMENTE:
1. Entender a dúvida apresentada pelo usuário.
2. Identificar quais artigos do CDC provavelmente estão relacionados à dúvida.
3. Informar o número desses artigos.
4. Fornecer uma explicação complementar, curta e clara, sobre por que aquele artigo pode ser relevante.
5. A explicação deve ser apresentada como COMPLEMENTO DA IA e nunca como texto oficial da lei.
REGRAS:
- Nunca invente artigos.
- Nunca crie artigos que não existam.
- Nunca escreva o texto integral ou parcial da lei como se fosse o artigo.
- Nunca altere o conteúdo da legislação.
- Nunca diga que sua explicação é o texto da lei.
- Não retorne artigos sem relação razoável com a pergunta.
- Prefira poucos resultados relevantes em vez de muitos resultados genéricos.
- O número do artigo deve estar entre 1 e 119.
- O campo "id" deve conter somente o número do artigo.
- "explicacao_ia" deve ser uma explicação complementar e curta.
- Se não houver relação suficientemente clara com algum artigo, retorne resultados vazio.
ATENÇÃO:
O aplicativo irá buscar o artigo completo no banco local cdc.json.
Portanto, você NÃO precisa e NÃO deve fornecer o texto do artigo.
FORMATO OBRIGATÓRIO:
{
  "resultados": [
    {
      "id": "18",
      "explicacao_ia": "Este artigo pode ser relevante porque trata de situações relacionadas a problemas apresentados pelo consumidor. A aplicação concreta depende das circunstâncias do caso."
    }
  ]
}
Se nenhum artigo for claramente relevante:
{
  "resultados": []
}
Responda SOMENTE com JSON válido.
`
            },
            {
              role: "user",
              content:
                query.trim()
            }
          ],
          response_format: {
            type: "json_object"
          }
        })
      }
    );
    /*
     * ==========================================================
     * VERIFICA RESPOSTA HTTP
     * ==========================================================
     */
    if (!response.ok) {
      const erroTexto =
        await response.text();
      console.error(
        "Erro HTTP Groq:",
        response.status,
        erroTexto
      );
      return res.status(500).json({
        erro: "Erro ao consultar a IA."
      });
    }
    /*
     * ==========================================================
     * CONVERTE RESPOSTA
     * ==========================================================
     */
    const data =
      await response.json();
    /*
     * ==========================================================
     * VERIFICA ERRO DA GROQ
     * ==========================================================
     */
    if (data.error) {
      console.error(
        "Erro Groq:",
        data.error
      );
      return res.status(500).json({
        erro: "Erro na resposta da IA."
      });
    }
    /*
     * ==========================================================
     * VERIFICA ESTRUTURA
     * ==========================================================
     */
    if (
      !data.choices ||
      !data.choices[0] ||
      !data.choices[0].message ||
      !data.choices[0].message.content
    ) {
      console.error(
        "Resposta inesperada da Groq:",
        data
      );
      return res.status(500).json({
        erro: "Resposta inválida da IA."
      });
    }
    /*
     * ==========================================================
     * PARSE DO JSON DA IA
     * ==========================================================
     */
    let resultado;
    try {
      resultado =
        JSON.parse(
          data.choices[0].message.content
        );
    } catch (parseError) {
      console.error(
        "IA não retornou JSON válido:",
        data.choices[0].message.content
      );
      return res.status(500).json({
        erro: "A IA retornou uma resposta inválida."
      });
    }
    /*
     * ==========================================================
     * GARANTE QUE RESULTADOS EXISTE
     * ==========================================================
     */
    if (
      !resultado ||
      !Array.isArray(resultado.resultados)
    ) {
      return res.status(200).json({
        resultados: []
      });
    }
    /*
     * ==========================================================
     * VALIDA OS RESULTADOS
     *
     * A IA pode errar.
     *
     * Por isso o servidor verifica:
     *
     * - ID numérico
     * - ID entre 1 e 119
     * - explicação existente
     *
     * O frontend também verifica se o artigo existe
     * no cdc.json.
     * ==========================================================
     */
    const resultadosValidos =
      resultado.resultados
        .filter(item => {
          if (!item) {
            return false;
          }
          const id =
            parseInt(item.id, 10);
          if (
            Number.isNaN(id) ||
            id < 1 ||
            id > 119
          ) {
            return false;
          }
          if (
            !item.explicacao_ia ||
            typeof item.explicacao_ia !== 'string' ||
            item.explicacao_ia.trim() === ''
          ) {
            return false;
          }
          return true;
        })
        /*
         * ======================================================
         * NORMALIZA OS DADOS
         * ======================================================
         */
        .map(item => {
          return {
            id:
              String(
                parseInt(item.id, 10)
              ),
            explicacao_ia:
              item.explicacao_ia
                .trim()
          };
        });
    /*
     * ==========================================================
     * REMOVE ARTIGOS DUPLICADOS
     * ==========================================================
     */
    const idsUtilizados =
      new Set();
    const resultadosSemDuplicados =
      resultadosValidos.filter(item => {
        if (
          idsUtilizados.has(item.id)
        ) {
          return false;
        }
        idsUtilizados.add(item.id);
        return true;
      });
    /*
     * ==========================================================
     * LIMITA A QUANTIDADE DE RESULTADOS
     *
     * Evita que a IA retorne dezenas de artigos.
     *
     * O objetivo é mostrar somente os complementos
     * realmente relevantes.
     * ==========================================================
     */
    const resultadosFinais =
      resultadosSemDuplicados.slice(0, 5);
    /*
     * ==========================================================
     * RESPOSTA FINAL
     * ==========================================================
     */
    return res.status(200).json({
      resultados:
        resultadosFinais
    });
  } catch (erro) {
    console.error(
      "Erro no servidor:",
      erro
    );
    return res.status(500).json({
      erro:
        "Falha ao processar a busca com IA."
    });
  }
}
