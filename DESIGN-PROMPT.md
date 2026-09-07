# Brief de design — Voice (app desktop de voz)

Cole este arquivo inteiro no ChatGPT (ou outra IA de design). Peça **uma tela por vez**, nesta ordem, com mock visual (layout + cores + componentes). Não invente features fora desta lista.

---

## O que é o produto

App **desktop** de voz em tempo real para squads que jogam juntos. Experiência **TeamSpeak 3**: abrir, informar um nick, entrar numa sala, falar num canal. Sem conta, sem e-mail, sem senha, sem chat e sem streaming neste momento.

A pessoa só tem **nickname** (e um id invisível no PC). Ela **cria** uma sala (nome → ganha um código) ou **entra** com o código. Dentro da sala há **canais de voz** (árvore à esquerda, pessoas embaixo de cada canal). Quem criou a sala é admin e pode criar canais e promover outros.

Janela de **programa**, não site de marketing. Vai ser usada **ao lado de um jogo** — compacta, legível, poucos cliques.

---

## Direção visual

**Estrutura:** TeamSpeak 3.  
**Aparência:** atual, limpa, no espírito Apple (macOS / iOS recente) — não um clone de Apple, não um clone pixel-perfect do TS3 de 2011.

Referências de layout (TS3):

- Janela única, densa, funcional
- Coluna esquerda = árvore (servidor → canais → pessoas)
- Rodapé = mic, mute, ensurdecer, status
- Pouca decoração; a árvore é o produto

Referências de visual (Apple moderno):

- Dark mode verdadeiro (cinzas quentes, não preto puro #000)
- Tipografia grande e legível, poucos pesos (regular + semibold)
- Cantos suaves, muito respiro, hierarquia clara
- Superfícies em camadas (barra, lista, rodapé) com separação sutil — quase vidro fosco, sem neon
- Botões primários discretos (preenchido claro ou azul sistema suave)
- Ícones lineares, finos, consistentes
- Microinterações: hover leve, estado de “falando” elegante (não LED piscando barato)

**Paleta sugerida (pode refinar, manter coerente):**

- Fundo: `#1C1C1E` / `#2C2C2E`
- Superfície: `#3A3A3C` com bordas `rgba(255,255,255,0.08)`
- Texto: `#F5F5F7` / secundário `#A1A1A6`
- Acento: azul sistema `#0A84FF`
- Sucesso / falando: `#30D158`
- Perigo / mute: `#FF453A`

**Não fazer:** visual Discord (roxo, blobs, nitro), gamer RGB, glassmorphism exagerado, ilustrações de onboarding longas, marketing landing.

Idioma da UI: **português (Brasil)**.

Formato da janela: app nativo **redimensionável**, em **paisagem e retrato**.

- Trabalho paisagem ~ **960×640** (home/sala); onboarding / criar / entrar ~ **420×520**
- Fullscreen paisagem (ex. 1440×900)
- **Monitor ou painel vertical** (ex. **1080×1920**): muito comum como segunda tela para voz enquanto joga. O app tem de ficar usável e bonito assim.

Em qualquer tamanho: o layout **estica**. Rodapé de voz sempre visível. Não é página de marketing — é janela de programa que preenche a tela.

Para cada tela, entregue:

1. Descrição do layout (zonas, alinhamento)
2. Lista de componentes e textos exatos
3. Estados (vazio, preenchido, erro, hover, disabled)
4. Cores / tipografia / espaçamento
5. Um mock em HTML+CSS **ou** wireframe ASCII + spec visual — o bastante para um dev React implementar com styled-components

---

## Tela 1 — Nickname (primeira abertura)

**Quando:** o `localStorage` está vazio. Única vez até limparem os dados do app.

**Objetivo:** a pessoa escreve como quer ser chamada. O app gera o id sozinho (ela não vê o id).

**Conteúdo:**

- Marca curta / nome do app no topo (pode ser só “Voice” por agora)
- Título: algo como “Como devemos te chamar?”
- Subtítulo curto: uma linha, sem jargão
- Campo de texto: nickname (placeholder “Seu nome”)
- Botão primário: “Continuar” — só ativo com nick válido (2–24 caracteres, trim)
- Sem “criar conta”, sem e-mail, sem termos em bloco

**Estados:** vazio; digitando; botão disabled; erro suave se o nick for inválido.

Gere esta tela primeiro.

---

## Tela 2 — Home (lista de salas)

**Quando:** já existe nickname no PC.

**Objetivo:** ver as salas salvas neste computador, criar uma nova ou entrar com código.

**Conteúdo:**

- Topo: nickname atual (pequeno, clicável no futuro para editar — no mock só mostra)
- Título: “Salas”
- Lista de bookmarks (nome da sala + código em secundário, ou só o nome)
- Ações sempre visíveis:
  - **Criar sala**
  - **Entrar com código**
- Estado vazio: ilustração mínima ou ícone + “Nenhuma sala ainda” + os dois botões em destaque
- Clique num item da lista = entrar nessa sala (sem pedir código de novo)

**Não ter:** busca complexa, pastas, amigos, DM, loja.

**Estados:** lista vazia; 1–N salas; item hover/selected.

---

## Tela 3 — Criar sala

**Quando:** clicou “Criar sala”. Pode ser janela/modal sobre a home ou tela cheia compacta.

**Passo A — nome**

- Título: “Nova sala”
- Campo: nome da sala
- Botão: “Criar”
- Voltar / cancelar para a home

**Passo B — código gerado** (logo após criar; a pessoa já é admin e já entra em seguida)

- Título: “Sala criada”
- Nome da sala
- Código grande, fácil de ler e **copiar** (botão “Copiar código”)
- Texto: quem tiver o código entra
- Botão: “Entrar na sala” (entra sozinha; no produto isso é automático — no mock mostre o botão)

**Estados:** campo vazio; criando (loading discreto); código visível; “copiado”.

---

## Tela 4 — Entrar com código

**Quando:** clicou “Entrar com código”. Modal ou tela compacta.

**Conteúdo:**

- Título: “Entrar numa sala”
- Campo do código (ex. `K7P-TIGRE`) — aceitar com ou sem hífen
- Botão: “Entrar”
- Cancelar

**Estados:** vazio; código inválido / sala inexistente (mensagem clara, sem jargão); sucesso → vai para a Tela 5.

---

## Tela 5 — Sala (a tela principal — TeamSpeak)

**Quando:** criou ou entrou. É 80% do tempo de uso.

**Layout (obrigatório, estilo TS3):**

```
┌─────────────────────────────────────────────┐
│  Nome da sala          [código] [copiar]    │  ← barra superior fina
├──────────────────┬──────────────────────────┤
│ ÁRVORE           │  (área direita reservada │
│                  │   e quase vazia no MVP:  │
│  ▼ Geral         │   sem chat. Pode ser     │
│      João  ●     │   só um painel calmo     │
│      Maria       │   com o canal atual      │
│  ▶ Afk           │   e quem está falando)   │
│                  │                          │
├──────────────────┴──────────────────────────┤
│  [mic] [mute] [ensurdecer]   João           │  ← rodapé de voz
└─────────────────────────────────────────────┘
```

**Barra superior**

- Nome da sala
- Código da sala visível + copiar (é o convite)
- Voltar às salas / lista (ícone discreto)

**Árvore esquerda**

- Canais como pastas/grupos
- Pessoas **dentro** do canal, com ícones:
  - falando (anel ou ponto verde suave)
  - mudo
  - ensurdecido
  - coroa / distintivo sutil no **admin** e no **dono**
- Canal atual destacado
- Clique no canal = trocar de canal (e de call)
- Admin: ação para **criar canal** (botão `+` na árvore ou no topo da lista)
- Clique direito ou menu `···` numa pessoa (se eu for admin): **Tornar admin**
- Dono nunca aparece como “rebaixável”

**Área direita (MVP)**

- Sem chat. Mantenha visual equilibrado: nome do canal, quantas pessoas, “falando agora: …”
- Não preencha com lorem ou cards inúteis

**Rodapé**

- Mute mic
- Ensurdecer (deafen)
- Indicador de mic (nível, se couber sem poluir)
- Meu nickname
- Estados: ativo / mudo / ensurdecido / sem permissão de mic (erro gentil)

**Fullscreen paisagem**

- Árvore com largura fixa (~260–300px) ou splitter suave; o restante vai para a direita
- Scroll só na árvore; rodapé sempre visível
- Mock extra: **1440×900**

**Retrato / monitor vertical (obrigatório na Tela 5 e na Home)**

- Largura estreita, altura longa (mock **1080×1920** ou janela **400×900**)
- A **árvore vira o centro** do app (é o que o TS faz bem numa segunda tela)
- Área direita da sala **empilha abaixo** da árvore ou some: no retrato basta canal atual + “falando agora” numa faixa curta, sem coluna morta
- Home: lista de salas em coluna única, botões Criar / Entrar fixos embaixo ou no topo
- Onboarding / criar / entrar já são estreitos — só centralizar com respiro, sem esticar campos de ponta a ponta de um 4K vertical
- Nada de layout quebrado, scroll horizontal ou textos cortados

**Estados da sala**

- Só eu no Geral
- Várias pessoas, uma falando
- Canal vazio
- Canal cheio (teto 12 — se tentar entrar, toast/mensagem)
- Acabei de criar um canal (nome curto + confirmar)

---

## Tela 6 — Home com salas + troca

Mesma Tela 2, mas mostre o fluxo de **várias salas salvas** e como a pessoa troca de sala sem novo cadastro. Pode ser um recorte da Tela 2 com 3 itens na lista (uma delas “você é admin”).

---

## Fora do MVP (não desenhar agora)

Chat, streaming, overlay em cima do jogo, loja, planos/pagamento, kick/ban, tela de renovar sala vencida, login.

Quando formos nessas, o visual deve **reusar** a mesma linguagem das telas 1–5.

---

## Como pedir no chat (depois de colar este brief)

Envie na sequência:

1. “Gere a Tela 1 (nickname) em HTML+CSS dark, janela 420×520, pronto para um dev copiar a estrutura.”
2. “Agora a Tela 2, estado vazio e estado com 3 salas.”
3. “Tela 3, passo A e passo B.”
4. “Tela 4, inclusive estado de código inválido.”
5. “Tela 5, sala com 5 pessoas em 2 canais — esta é a mais importante, capriche na árvore e no rodapé. Faça três recortes: janela 960×640, fullscreen 1440×900 e retrato 1080×1920 (monitor vertical).”
6. “Tela 2 também em retrato 1080×1920 (lista + botões).”
7. “No final, extraia um mini design system: cores, raios, tipografia, botão, input, item de lista, ícone de falando.”

Peça que o HTML das telas compartilhe as **mesmas variáveis CSS**, para o React/styled-components ficar consistente.
