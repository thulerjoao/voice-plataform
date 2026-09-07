# Plano do produto — voz P2P (estilo TeamSpeak enxuto)

Documento de referência. Qualquer mudança de comportamento deve atualizar este arquivo antes do código.

---

## 1. Visão

Plataforma de **voz em tempo real** para grupos (squad de jogo), com custo de infra próximo de zero: o servidor **não transmite áudio**. A voz corre **P2P** dentro de cada canal. O primeiro da canal é o host; um sucessor já está pré-eleito para a call não morrer se o host sair.

Inspiração de UX: TeamSpeak (entrar e falar, identidade no PC, árvore sala → canais).  
Não é um clone do Discord (sem conta na nuvem, sem DM, sem Nitro).

Público inicial: Windows, usando o app **junto com o jogo**. Interface simples, direta, leve.

Restrição de dinheiro: um VPS pequeno deve aguentar **muitas salas pequenas**, não uma sala gigante.

---

## 2. Princípios

- Praticidade > hierarquia. Convite vazou → cria outra sala. Sem girar código no MVP.
- Identidade no computador, não cadastro.
- Lista de salas só no PC (bookmarks).
- A API é barata: HTTP + WebSocket de sinalização. Áudio não passa nela.
- Client desatualizado não **entra**; quem já está na call **não é derrubado**.
- Chat e streaming nascem **no mesmo canal**, depois — não como produto paralelo.

---

## 3. Stack

| Camada | Escolha | Onde roda agora |
|---|---|---|
| API | **Go** | WSL2 |
| Banco | **PostgreSQL 16** | Docker no WSL2 |
| Sinalização | WebSocket no mesmo processo da API | WSL2 |
| Client MVP | **React + TypeScript + Vite** (navegador) | código no WSL2; Chrome/Edge no Windows em `localhost` |
| Client final | mesma UI no **Tauri** | build do `.exe` **fora do WSL**, no Windows |
| Voz | WebRTC no WebView/browser (Opus nativo) | no client |
| TURN | **fora do MVP** (coturn depois) | — |

**Não usar:** Electron, Next.js, Express/Node na API, Nest, servidor de mídia no MVP.

Um repositório, duas pastas:

```
voice-plataform/
  PLAN.md
  docker-compose.yml          # Postgres
  api/                        # Go
  client/                     # React + Vite (depois + Tauri)
```

API no dia a dia: `go run` no WSL apontando para o Postgres do Compose.  
Docker = **banco**. A API pode ir para o Compose depois; não é obrigatório no começo.

---

## 4. Modelo mental

```
PC do usuário                         Nosso backend (Go + Postgres)
─────────────────                     ────────────────────────────
Identidade (uid + nickname)           Sala (id, nome, código, ownerUid)
Bookmarks (lista local de salas)      Canais
React / depois Tauri                  Membros: uid → papel (owner | admin | member)
WebRTC ◄── P2P do canal ──► amigos    WebSocket: presença, host, sucessor, ICE
```

Três coisas que não se misturam:

1. **Identidade** — quem você é (arquivo no PC).
2. **Código da sala** — porta para quem **ainda não é membro**.
3. **Papel na sala** — dono / admin / membro, no banco, por `uid`.

O “endereço” da sala **não é IP**. IP do host de voz muda. O estável é o **código** (e o nome só identifica na UI).

---

## 5. Identidade (estilo TeamSpeak)

Na **primeira abertura** do client:

- A pessoa informa só o **nickname**.
- O app gera um `uid` único (UUID) e guarda **no disco** (`uid` + nickname).
- Não existe tela de e-mail, senha ou “criar conta”.

Nas aberturas seguintes: nickname e `uid` já existem. Dá para editar o nickname localmente; o `uid` não muda.

O mesmo `uid` vale para **todas** as salas daquele PC. Criar ou adicionar sala **não** cria outro usuário.

**PC novo / formatou o disco:** vira outra identidade. Precisa do código de novo para entrar. Dono da sala antiga se perde até existir “exportar/importar identidade” (futuro).

O backend grava um registro de cliente **por sala** (uid, nickname, papel) quando a pessoa cria ou entra. Não há tabela global de “conta Discord”.

---

## 6. Salas

### Criar

1. Usuário informa o **nome** da sala.
2. A API gera um **código de acesso** (ex.: `K7P-TIGRE`), único.
3. O `uid` de quem criou fica gravado como **owner** e **admin**.
4. Canal padrão: `Geral`.
5. O client **entra sozinho** na sala após criar.
6. Bookmark salvo **só no PC** (nome, código, id da sala).

### Entrar

- Nickname já está no PC.
- Informa o **código**.
- Se o `uid` ainda não é membro: valida código → vira `member` → entra.
- Se o `uid` já é membro: entra **sem código** a partir do bookmark.

### Lista de salas

Somente no computador. Painel / home: trocar de sala ou adicionar (colar código).  
**Não** sincronizar lista no nosso banco.

### Código vazou

No MVP: o dono **cria outra sala**. Sem invalidar código, sem senha extra, sem sala privada.

A senha/código **não** fica pública na UI como “segredo entre membros” além do necessário para copiar e chamar gente. O código é a fechadura de quem está **fora**. Membros conhecidos não dependem dele para voltar.

### Limites

- Muitos grupos pequenos = ok.
- Por **canal**: teto **12**; alvo confortável para jogo **8**.
- Recusar entrada no canal se estiver cheio.

---

## 7. Papéis

| Papel | Quem é | MVP |
|---|---|---|
| **Owner** | `uid` que criou a sala; gravado no dia 1; não rebaixa | implícito (é admin e não pode perder isso) |
| **Admin** | owner + quem um admin promover | criar/apagar canal; promover outros |
| **Member** | demais | entrar em canal e falar |

Regras MVP:

- Só **admin** cria e apaga canal.
- Admin **pode promover** outros a admin.
- Owner **não pode ser rebaixado** (o campo existe desde o início, mesmo sem tela de “rebaixar”).
- Sem kick, ban, transferir dono, apagar sala (podem ficar para depois).

---

## 8. Canais e voz

- Uma sala tem N canais de voz.
- Estar na sala ≠ estar em um canal de voz. Ao entrar na sala, o client cai no `Geral` (ou no último canal bookmark, se houver).
- **Trocar de canal** = sair do P2P antigo e entrar no P2P novo, **sem sair da sala**.
- Cada canal = uma malha **estrela**: um **host** (primeiro que entrou no canal) e os outros como client dele.
- A API só sinaliza: quem está no canal, quem é host, quem é sucessor, troca ICE/SDP.

### Host e sucessor (obrigatório no MVP)

- Host = primeiro a entrar no canal.
- Enquanto a call roda, já existe um **sucessor** escolhido (segundo a entrar, ou próximo da lista).
- Clientes já abrem WebRTC **em espera** com o sucessor (sem áudio ainda, se possível).
- Host some (heartbeat ~300–500 ms) → sucessor vira host → engasgo curto, **não** “sala caiu”.
- Sem eleição por ping/NAT no MVP.
- Sem TURN no MVP: se o P2P não furar NAT, aquela pessoa não entra no canal.

### Áudio no client (MVP)

- WebRTC (Opus já é nativo no browser/WebView).
- Mute, ensurdecer, indicador de quem fala, volume **local** por pessoa.
- VAD; PTT se for barato de encaixar, senão no pós-MVP.
- TypeScript **não** processa o áudio; só orquestra. Rust de pipeline de voz **não** entra no MVP.

### Topologia e custo

A API não mistura áudio. Quem paga CPU/upload é o **host do canal**. Por isso o teto 8–12.  
O produto escala em **número de salas**, não em tamanho de um único canal.

TURN (futuro): coturn quando a % de falha de NAT doer. Voz relayada é barata; vídeo/stream no TURN é que fica caro. Até lá, STUN público basta para tentar o hole punching.

---

## 9. Versão do client

- A API publica versão mínima (e a atual).
- Client **abaixo da mínima** não consegue **entrar** em sala.
- Quem **já está** em call **não é desconectado** quando uma versão nova sobe.
- Ao sair da call, a próxima entrada exige o client novo.
- Breaking change pesado: barrar **entrada nova** naquela sala, ainda sem derrubar quem já está.
- Nunca forçar fechar o app no meio da partida.

---

## 10. Telas do MVP

1. **Onboarding (uma vez):** nickname.
2. **Home:** lista local de salas; botões Criar / Entrar (código).
3. **Criar sala:** nome → mostra código + copia → entra automático.
4. **Sala:** árvore à esquerda (nome da sala, canais, nicks, ícones de mute/falando); rodapé (mute, ensurdecer, mic); código visível para copiar convite.
5. Trocar de sala pela lista, sem novo cadastro.

Visual: escuro, poucos botões, janela de app — não site marketing.

---

## 11. API (Go) — responsabilidade

**HTTP (REST), grosso modo:**

- `POST` criar sala (nome + uid + nickname) → sala + código + canal Geral + owner
- `POST` entrar por código
- `POST` reentrar (uid já membro)
- canais: listar; admin cria/apaga
- promover admin
- `GET` versão mínima do client

**WebSocket:**

- presença na sala / no canal
- heartbeat do host
- eleição / anúncio de sucessor
- sinalização WebRTC (offer, answer, ICE)
- eventos: entrou/saiu do canal, mute (se quisermos ícone remoto), promoveu admin

**Postgres persiste:**

- salas (id, nome, código, owner_uid, created_at)
- canais (id, room_id, nome)
- membros (room_id, uid, nickname, role)
- nada de bookmarks, nada de senha de “conta”, nada de blobs de áudio

**A API não:**

- recebe, mistura ou grava voz
- guarda a lista de salas do usuário
- autentica e-mail/senha

---

## 12. Client (React) — responsabilidade

- Gerar e ler identidade no `localStorage` (web) / disco (Tauri depois).
- Bookmarks no mesmo armazenamento local.
- UI das telas acima.
- `getUserMedia` + `RTCPeerConnection` por canal.
- Respeitar versão mínima antes de conectar.
- Falar com a API via HTTP + WebSocket.

No MVP o “app” é o navegador. Tauri só **empacota a mesma UI** depois.

---

## 13. Ordem de implementação (MVP)

Fazer nesta ordem. Não pular voz “para depois do visual inteiro”, mas também não começar por WebRTC sem sala existir.

| # | Entrega | Critério de pronto |
|---|---|---|
| 0 | Pastas `api/` + `client/` + Postgres no Docker | `compose up` sobe o banco; `go run` no `/health`; Vite abre |
| 1 | Identidade no client | nickname na 1ª vez; uid persistido |
| 2 | Criar / entrar sala (HTTP) | código gerado; owner no banco; bookmark local; auto-join |
| 3 | Tela da sala + canal Geral | árvore; lista de membros via WS |
| 4 | Admin cria canal + promove | só admin; owner intocável |
| 5 | WebRTC no canal | 2 pessoas falam no Geral |
| 6 | Troca de canal = outro P2P | 3ª pessoa em outro canal não ouve o Geral |
| 7 | Host + sucessor | matar o host não encerra a call |
| 8 | Áudio básico | mute, deafen, falando, volume local; teto 8–12 |
| 9 | Gate de versão | client velho não entra; call atual segue |
| 10 | Polimento de UI | fluxo contínuo nick → sala → falar |

Depois do item 10 o MVP **funcional** está fechado (ainda no navegador).

**Empacotar Tauri** é o passo **seguinte ao MVP web**, não parte do critério 1–10.

---

## 14. Fora do MVP (backlog)

### App desktop

- Tauri (Windows primeiro), build fora do WSL
- bandeja, instalador, identidade/bookmarks em AppData
- exportar / importar identidade

### Rede

- coturn (TURN) quando NAT falhar demais no Brasil
- eleição de host por ping / tipo de NAT / upload
- dual-host (dobra upload — só se o sucessor ainda engasgar)

### Moderação e sala

- kick / ban
- rebaixar admin (nunca o owner)
- invalidar / girar código
- senha por canal, canal privado
- apagar sala, transferir owner
- privilege key estilo TS

### Comunicação extra (no **mesmo** canal)

- chat de texto (canal + sala)
- streaming / câmera (aí TURN e banda passam a importar de verdade)

### UX de jogo

- overlay
- PTT global (hotkey com o jogo em foco)
- AFK channel automático
- canais temporários

### Motor de áudio

- Rust só se medir CPU alta in-game ou WebRTC no WebView ficar curto

### O que não é o produto agora

- file transfer, music bot, 3D audio
- permissões granulares estilo TS3
- mobile
- contas Discord-like, amigos, DM
- salas de dezenas/centenas de pessoas no mesmo canal

---

## 15. Custos (lembrete)

| Item | MVP | Depois |
|---|---|---|
| VPS + Postgres | um droplet barato aguenta sinalização de muitas salas | crescer vertical/horizontal se WS lotar |
| STUN | público / de graça | — |
| TURN | não | coturn no mesmo VPS; caro de verdade só com vídeo |
| Mídia central | nunca no plano atual | só se um dia abandonarmos P2P |

---

## 16. Escopo travado — checklist

**MVP inclui**

- [x] Go + Postgres + React/Vite
- [x] Identidade local (nick + uid)
- [x] Criar sala com nome → código; auto-join; creator = owner/admin
- [x] Entrar com código; bookmarks só no PC
- [x] Canais; cada um P2P; host + sucessor
- [x] Admin cria canal e promove
- [x] Teto 8–12 por canal
- [x] Sem TURN, sem chat, sem stream, sem Tauri
- [x] Update: trava no entrar, não na call

**MVP não inclui** tudo da seção 14.

---

## 17. Próxima ação

Pastas `api/` e `client/` criadas. Instalar Go no WSL, subir o Postgres e começar o item **1** da seção 13 (identidade no client).
