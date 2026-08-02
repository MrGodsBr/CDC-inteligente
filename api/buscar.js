// --- PESQUISA INTELIGENTE VIA IA + EXIBIÇÃO COMPLETA LOCAL ---
async function performTextSearch() {
  const term = document.getElementById("search-term-input").value.trim();
  const container = document.getElementById("search-results-container");
  
  if (!term) return;
  container.innerHTML = '<div class="loading-spinner">Consultando IA (Groq)...</div>';

  try {
    // 1. Pergunta para a IA qual artigo trata daquele assunto
    const response = await fetch('/api/buscar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: term })
    });

    const data = await response.json();

    if (data.erro || !data.resultados || data.resultados.length === 0) {
      container.innerHTML = `<div class="empty-msg">Nenhum artigo encontrado para "${term}".</div>`;
      return;
    }

    // 2. Carrega o banco de dados local cdc.json com o texto completo e oficial
    const db = await getDatabase();

    container.innerHTML = "";
    data.resultados.forEach(res => {
      // Busca o texto rico e completo de dentro do cdc.json
      const textoOficialCompleto = getArticleTextFromData(db, res.id);
      
      // Cria uma prévia limpa para o resultado da lista
      let preview = res.snippet;
      if (textoOficialCompleto) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = textoOficialCompleto;
        preview = (tempDiv.textContent || tempDiv.innerText || "").substring(0, 110) + "...";
      }

      const item = document.createElement("div");
      item.className = "result-item";
      
      // Ao clicar, exibe o TEXTO OFICIAL COMPLETO (do cdc.json)
      item.onclick = () => fetchAndDisplayArticle(res.id, textoOficialCompleto);
      
      item.innerHTML = `
        <div class="result-title">Artigo ${res.id}</div>
        <div class="result-snippet">${preview}</div>
      `;
      container.appendChild(item);
    });

  } catch (err) {
    console.error("Erro na busca:", err);
    container.innerHTML = '<div class="empty-msg">Falha na conexão. Tente novamente.</div>';
  }
}
