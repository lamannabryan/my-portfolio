# Screenshots — Gestão da Rede Demonstrativa

Abra index.html para visualizar a galeria. Os 12 PNGs estão na pasta screenshots.

- Computador: 3200 × 2240 pixels (10 imagens).
- Celular: 1290 × 3000 pixels (2 imagens).
- Layouts, gráficos e interações do frontend do projeto.
- Logotipo original substituído por identificação textual genérica.
- Nomes, CNPJs, contatos, endereços, scores e valores inteiramente fictícios.
- CNPJs, telefones e CEPs são marcadores demonstrativos, sem uso cadastral.
- Período demonstrativo: setembro de 2026. Certificados referenciados em 03/10/2026.
- Nenhuma conexão ao banco, gravação ou alteração dos arquivos da aplicação.
- Dados de score e correlação calculados pelo serviço original do projeto.
- Capturas novas deste sistema; o ZIP fornecido orientou a galeria e a anonimização.

Para gerar novamente, na raiz do projeto:

```powershell
node scripts/criar-apresentacao-generica.cjs
```

Requer Chrome ou Edge e playwright-core. É possível indicar os caminhos com PRESENTATION_BROWSER e PRESENTATION_PLAYWRIGHT.

Observações de apresentação:

- Viewport e largura do conteúdo móvel ajustados somente na renderização das capturas.
- A consulta IA usa uma resposta demonstrativa fixa e não executa consulta ao banco nem chamada a um modelo de IA.
