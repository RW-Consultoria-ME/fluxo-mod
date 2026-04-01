# FluxoMod

**Ferramenta de diagramação 100% open source, offline e segura.**

Uma alternativa completa ao LucidChart que roda inteiramente no seu navegador, sem necessidade de internet ou servidores externos. Seus dados nunca saem do seu computador.

## ✨ Funcionalidades

### Formas e Elementos
- **30+ tipos de formas**: retângulos, círculos, losangos, triângulos, hexágonos, estrelas, nuvens, cilindros e muito mais
- **Formas de fluxograma**: processo, decisão, terminador, dados, documento, banco de dados, atraso, entrada manual, etc.
- **Containers**: swimlanes horizontais e verticais
- **Texto**: blocos de texto editáveis com formatação

### Conectores
- **3 tipos**: reto, cotovelo (elbow) e curvo
- **6 tipos de setas**: nenhuma, seta aberta, seta preenchida, losango, círculo
- **Rótulos**: adicione texto aos conectores
- **Portas de conexão**: conexão inteligente nos pontos cardeais das formas

### Edição
- **Arrastar e soltar** formas da biblioteca para o canvas
- **Redimensionar** com alças visuais
- **Rotacionar** com controle de ângulo (snap a 15°)
- **Copiar/Colar/Recortar** com atalhos padrão
- **Duplicar** elementos rapidamente
- **Desfazer/Refazer** ilimitado
- **Seleção múltipla** com Shift+clique ou retângulo de seleção
- **Alinhamento**: esquerda, direita, topo, base, centro horizontal/vertical
- **Ordenação**: trazer para frente, enviar para trás

### Canvas
- **Zoom infinito** com scroll do mouse (10% a 500%)
- **Pan** com botão do meio ou ferramenta mão
- **Grade** com linhas ou pontos, redimensionável
- **Réguas** com medidas precisas
- **Snap inteligente** à grade e a outros elementos
- **Guias de alinhamento** automáticas
- **Minimapa** para navegação rápida

### Estilização
- Cores de preenchimento e borda personalizáveis
- Espessura e estilo de borda (sólido, tracejado, pontilhado)
- Opacidade ajustável
- Cor, tamanho e alinhamento de texto
- Sombras configuráveis

### Arquivos
- **Salvar/Abrir** projetos no formato `.fluxo` (JSON)
- **Exportar PNG** em alta resolução (2x)
- **Exportar SVG** vetorial
- **Auto-save** automático a cada 15 segundos
- **Múltiplos projetos** salvos no navegador

### Templates
- 📊 Fluxograma
- 🏢 Organograma
- 🧠 Mapa Mental
- 🏊 Swimlane
- 🌐 Diagrama de Rede
- 🗃️ Diagrama ER (Entidade-Relacionamento)
- 📄 Em Branco

### Atalhos de Teclado
| Atalho | Ação |
|--------|------|
| `V` | Ferramenta Seleção |
| `H` | Ferramenta Mão |
| `R` | Retângulo |
| `O` | Círculo |
| `D` | Losango |
| `L` | Conector |
| `T` | Texto |
| `Ctrl+Z` | Desfazer |
| `Ctrl+Y` | Refazer |
| `Ctrl+C/V/X` | Copiar/Colar/Recortar |
| `Ctrl+D` | Duplicar |
| `Ctrl+A` | Selecionar tudo |
| `Ctrl+S` | Salvar |
| `Ctrl+E` | Exportar PNG |
| `Ctrl+Shift+E` | Exportar SVG |
| `Ctrl++/-` | Zoom in/out |
| `Ctrl+0` | Zoom 100% |
| `Delete` | Excluir seleção |

## 🚀 Como Usar

1. Abra o arquivo `index.html` no seu navegador
2. Escolha um template ou comece do zero
3. Arraste formas da biblioteca lateral para o canvas
4. Conecte as formas clicando nos pontos de conexão
5. Personalize cores e estilos no painel de propriedades
6. Salve ou exporte seu diagrama

**Não precisa instalar nada. Não precisa de internet. Não precisa de servidor.**

## 🔒 Segurança e Privacidade

- **100% offline**: nenhuma requisição de rede é feita
- **Dados locais**: tudo é armazenado no localStorage do navegador
- **Zero dependências externas**: nenhum framework ou biblioteca de terceiros
- **Código aberto**: audite o código você mesmo

## 🛠️ Tecnologias

- HTML5 Canvas
- CSS3 (design system completo com tema escuro)
- JavaScript puro (ES6+)
- Zero dependências

## 📁 Estrutura do Projeto

```
fluxo-mod/
├── index.html          # Página principal
├── css/
│   └── main.css        # Estilos e design system
├── js/
│   ├── app.js          # Controlador principal
│   ├── shapes.js       # Definições de formas (30+ tipos)
│   ├── connectors.js   # Sistema de conectores
│   ├── selection.js    # Gerenciamento de seleção
│   ├── history.js      # Desfazer/refazer
│   ├── grid.js         # Grade, réguas e snap
│   ├── export.js       # Exportação PNG/SVG/JSON
│   ├── storage.js      # Salvamento e auto-save
│   ├── shortcuts.js    # Atalhos de teclado
│   ├── clipboard.js    # Copiar/colar
│   ├── align.js        # Alinhamento e distribuição
│   ├── minimap.js      # Widget de minimapa
│   ├── templates.js    # Templates de diagramas
│   └── utils.js        # Funções utilitárias
├── README.md
├── .gitignore
└── LICENSE
```

## 📄 Licença

MIT License — Use, modifique e distribua livremente.
