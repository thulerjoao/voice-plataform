# Plano do produto — voz P2P (estilo TeamSpeak enxuto)

Documento de referência. Qualquer mudança de comportamento deve atualizar este arquivo antes do código.

---

## 1. Visão

Plataforma de **voz em tempo real** para grupos (squad de jogo). O servidor faz sinalização; o áudio corre **P2P** dentro de cada canal. O primeiro a entrar no canal é o host; um sucessor já está pré-eleito para a call continuar se o host sair.

Inspiração de UX: TeamSpeak — entrar e falar, identidade no PC, árvore servidor → salas.

Vocabulário da UI: **servidor** = o bookmark com código (antes “sala”). **Sala** = o canal de voz (antes “subsala” / “canal”). “Canal” no texto técnico = sala.

Público inicial: Windows, usando o app **junto com o jogo**. Interface simples, direta, leve.

Um VPS pequeno deve aguentar **muitas salas pequenas**.

---

## 2. Princípios

- Praticidade. Convite vazou → cria outra sala.
- Identidade no computador.
- Lista de servidores só no PC (bookmarks).
- API: HTTP + WebSocket de sinalização. Áudio no P2P.
- Client desatualizado fica de fora de **entradas novas**; quem já está na call continua.
- Chat e streaming, quando existirem, entram **na mesma sala**.

---

## 3. Stack

| Camada        | Usar                                        | Onde roda agora                                       |
| ------------- | ------------------------------------------- | ----------------------------------------------------- |
| API           | **Go** + **sqlc**                           | WSL2                                                  |
| Banco         | **PostgreSQL 16**                           | Docker no WSL2                                        |
| Sinalização   | WebSocket no mesmo processo da API          | WSL2                                                  |
| Client MVP    | **React + TypeScript + Vite** (navegador)   | código no WSL2; Chrome/Edge no Windows em `localhost` |
| Client final  | mesma UI no **Tauri**                       | build do `.exe` no Windows, fora do WSL               |
| Voz           | **WebRTC** (Opus nativo no browser/WebView) | no client                                             |
| Hole punching | **STUN** público                            | no client                                             |
| TURN          | **coturn**, depois do MVP                   | VPS                                                   |

Um repositório, duas pastas:

```
voice-plataform/
  PLAN.md
  docker-compose.yml          # Postgres
  api/                        # Go
  client/                     # React + Vite (depois + Tauri)
```

API no dia a dia: `go run` no WSL apontando para o Postgres do Compose.  
Docker = **banco**. A API pode ir para o Compose depois.

---

## 4. Modelo mental

```
PC do usuário                         Nosso backend (Go + Postgres)
─────────────────                     ────────────────────────────
Identidade (uid + nick + recuperação) Sala (id, nome, código, ownerUid)
Bookmarks (servidores na sidebar)     Salas (canais de voz)
React / depois Tauri                  Membros: uid → papel (owner | admin | member)
                                      Users: uid → código de recuperação (hash)
WebRTC ◄── P2P do canal ──► amigos    WebSocket: presença, host, sucessor, ICE
```

Três peças:

1. **Identidade** — quem você é (neste PC). Recuperação por **código longo**, não por login.
2. **Código do servidor** — convite, para passar adiante.
3. **Papel no servidor** — dono / admin / membro, no banco, por `uid`.

O endereço estável do servidor é o **código**. O nome aparece na UI. O IP do host de voz é interno à sala.

---

## 5. Identidade (estilo TeamSpeak)

Na **primeira abertura** do client:

- A pessoa informa o **nickname**.
- A API gera um `uid` (UUID) e um **código de recuperação** único: 5 grupos de 4 (`XXXX-XXXX-XXXX-XXXX-XXXX`), alfabeto sem `0/O/1/I`. Não é o formato `XXX-ANIMAL` do servidor.
- A UI **mostra o código uma vez**, com aviso: guardar em lugar seguro; **não compartilhar**. Sem o código, formatar o PC = pessoa nova. O código também fica na aba **Conta**.
- Também dá para **já ter um código**: cola a recuperação → `POST /api/identity/restore` devolve o `uid`, o nick e os servidores em que esse uid ainda é membro → este PC grava identidade + bookmarks.
- Identidade antiga só neste PC (sem linha em `users`) é sincronizada na abertura: `POST /api/identity` com o uid + código local. Áudio **não** vai no servidor.

Nas aberturas seguintes: nickname, `uid` e o código (se este PC ainda o tiver) já existem. Nickname pode ser editado na sidebar e na aba **Conta** das configurações; o `uid` permanece. O código fica nessa mesma aba, para copiar, com o aviso. **Sair deste PC** também está ali.

O mesmo `uid` vale para **todas** as salas daquele PC. Criar ou adicionar servidor reutiliza esse usuário.

Dois “sair”, nomes diferentes:

- **Sair deste PC** (logout) — apaga identidade e bookmarks **neste computador**. Áudio local fica (é deste PC). No banco o `uid` e os papéis continuam. Volta à tela do nick. Recupera com o código.
- **Sair do servidor** — só **membro** e **admin** (dono não vê o botão; transferir owner é depois). Confirmar no fim das configurações. Tira o `uid` de `members` e o bookmark. Restore **não** traz de volta. Quiser voltar: entra de novo pelo código, salvo se estiver em `blocked`.

Se o `localStorage` for apagado sem o código: nickname de novo, `uid` novo; o uid antigo continua no banco, este client é outro usuário.

Status local (sidebar): **online**, **ocupado**, **volto logo**. A bolinha da **sua** linha nas salas segue esse status. Sem invisível — no P2P quem está no canal precisa aparecer. Por enquanto só no PC; a sinalização vem com o WebSocket.

---

## 6. Servidores

### Criar

1. Usuário informa o **nome** do servidor (3–24 caracteres; sem aviso na UI — o campo simplesmente não passa de 24).
2. A API gera um **código de acesso** (ex.: `K7P-TIGRE`), único.
3. O `uid` de quem criou fica como **owner** e **admin**.
4. Sala padrão: `Geral`.
5. O client **entra sozinho** no servidor após criar (só visualiza; não entra em call).
6. Bookmark salvo **só no PC** (nome, código, id do servidor).

### Entrar

- Nickname já está no PC.
- Informa o **código**.
- Se o `uid` ainda não é membro: valida código → se estiver em `blocked`, recusa; senão vira `member` → entra.
- Se o `uid` já é membro: entra a partir do bookmark, sem pedir o código de novo.

### Lista de servidores

A sidebar é a lista local de **servidores** (bookmarks), não de salas. **Servidores** é só o título da lista (não clicável, visual sempre o de “não selecionado”). O primeiro card, **Adicionar servidor**, tem o mesmo tamanho dos bookmarks e abre o centro de criar/entrar; uma **linha tracejada** separa esse card dos bookmarks. Cada bookmark é um **card** baixo: só o nome; o que você olha destaca; a call ganha o ícone de áudio. Sem código, sem ícone de pessoas. Olhar outro servidor, a home, as configurações de áudio ou as **configurações do servidor** **não** sai da call. Entrar numa sala noutro servidor é que troca a call. O centro mostra o empty ou o servidor aberto — nunca a listagem. **Sair do servidor** (membro/admin; confirmar) tira o membro no banco e o bookmark; restore não traz. Bloqueado permanece em `blocked` e o código recusa.

### Configurações do servidor

Engrenagem ao lado do nome (todo mundo). Abre no centro (mesmo padrão do áudio). Nome (3–24; lápis → input → check; bookmark atualiza na hora), código, data de criação e **membros** (você no topo; nick à esquerda; ações; **cargo por último**). Lista inclui gente **mock** só para visualizar. Promover a admin: dono e admin. **Excluir** e **bloquear** (ícone de proibido vermelho): dono e admin em **membro**; se o alvo é **admin**, só o dono. Mock nesta tela. No fim: **Sair do servidor** (só membro/admin), com confirmação. Plano/expiração: depois.

### Código vazou

No MVP: o dono **cria outro servidor**. O código serve para copiar e chamar gente de fora. Membros conhecidos voltam pelo `uid`.

### Limites

- Muitos grupos pequenos.
- Por **sala**: teto **12** (ex.: `4/12`). Voz Opus no host é leve; 8 era só o alvo confortável.
- Sala cheia: recusar entrada.

---

## 7. Papéis e presença

Quem tem o código entra em qualquer canal. Status na árvore: bolinha **oca** (online / ocupado / volto logo). Mudo / ensurdecido: ícone azul à direita do nick. Quem está falando: a bolinha fica **sólida** (sua linha: o mic, corte do VAD ou PTT + voz; mudo/ensurdecido não).

Cargos mínimos:

| Papel      | Pode                                                                                   |
| ---------- | -------------------------------------------------------------------------------------- |
| **Owner**  | tudo de admin + rebaixar admin + **excluir / bloquear** admin                          |
| **Admin**  | mover gente + criar / renomear / apagar sala + **renomear o servidor** + **promover** membro a admin + **excluir / bloquear membro**. Não mexe no dono nem rebaixa / exclui / bloqueia outro admin |
| **Member** | entrar em sala e arrastar só a si                                                      |

Cargo não aparece nas linhas dos outros (você se reconhece pelo fundo). Na **sua** linha, o papel fica discreto **à direita** do nick, só quando você está numa sala. Cargo completo na ficha.

Clique no nick abre a **ficha**: status com bolinha, tempo conectado, volume local daquela pessoa, **promover a admin** (dono e admin; só em membro). Rebaixar admin: só dono. Recado: envia a primeira mensagem e abre uma **aba** no chat (1:1). Uma conversa visível por vez; clicar na aba troca. Som no destinatário. Sem modal. Sem banco — some ao recarregar. Dá para fechar a aba e reabrir no mesmo uso.

---

## 8. Salas e voz

- Um servidor tem N **salas** (layout tipo TS3: árvore + chat embaixo). Admin/dono abre a ficha da sala (engrenagem): **Nome** e **Descrição** no mesmo padrão do nickname (texto + lápis; input só ao editar; check salva neste PC). “Excluir sala” no fim da ficha (não apaga a última). Quem estava nela **sai da call** — não vai para outra sala (não existe sala padrão garantida). **Nova sala** no fim da lista, só admin/dono. Na lista: **nome à esquerda**, descrição ao lado (reticências se for longa), `n/12`. Expandir/recolher a árvore fica neste PC.
- Ao abrir um servidor (sidebar, criar ou entrar), você **só visualiza** — não entra em sala nem no `Geral`. Clique numa sala (ou arraste o nick) para entrar na call. Se já há call noutro servidor, ela continua até você entrar numa sala daqui. À direita da **sua** linha, **Sair** tira da sala e fica no servidor sem estar em nenhuma (som de saída). Chat só com sala.
- **Trocar de canal** = sair do P2P antigo e entrar no P2P novo, ainda no mesmo servidor. Clique no canal ou arrastar o nick.
- Som curto quando **você** entra num canal e quando **alguém entra no canal em que você está**. Outro som, mais baixo, quando **você** sai (**Sair** ou a sala some) e quando **alguém sai da sua sala**. Trocar de sala: só o de entrada. Ensurdecido = sem som.
- Arrastar **outra pessoa** para um canal é só de **admin/dono**. Qualquer um arrasta a si.
- Chat por sala: **simples**. Broadcast no WebSocket; **sem banco**. A mensagem chega só a quem estava naquela sala na hora. Cada um desses clients guarda o texto **no próprio PC**; quem não estava não vê depois, nem ao entrar. Não é MVP, mas não é difícil.
- Cada canal = malha **estrela**: um **host** (primeiro que entrou) e os outros como client dele.
- A API sinaliza: quem está no canal, quem é host, quem é sucessor, troca ICE/SDP.

### Host e sucessor (MVP)

- Host = primeiro a entrar no canal.
- Já existe um **sucessor** escolhido (segundo a entrar, ou próximo da lista).
- Clientes abrem WebRTC **em espera** com o sucessor.
- Host some (heartbeat ~300–500 ms) → sucessor vira host → a call continua (engasgo curto).

### Áudio no client (MVP)

- WebRTC (Opus nativo).
- Mute, ensurdecer, indicador de quem fala, volume **local** por pessoa.
- Ensurdecer (fone ou volume em 0): a barra de **volume geral** vai a 0. Ouvir de novo (fone ou subir a barra) restaura o volume e abre o mic.
- **Configurações** (deste PC, `localStorage`): microfone, fone, ganho de entrada (−30 a +30 dB) e **volume geral** (também no rodapé da sidebar), eco/ruído/AGC (no teste do mic o eco desliga, senão come a própria voz), modo **automático (VAD)** ou **PTT**, atalho de PTT e de **mutar** (tecla ou botão do mouse; o de mutar fecha mic e fone juntos, com um som curto ao mutar e outro ao liberar). Atalhos com o app em foco; PTT/mudo com o jogo na frente entra no instalável.
- TypeScript orquestra (`getUserMedia`, `RTCPeerConnection`).

### Escala

Quem usa CPU/upload da voz é o **host do canal**. Teto **12**.  
O produto cresce em **número de salas**.

STUN público no MVP. **coturn** quando a falha de NAT pedir.

---

## 9. Versão do client

- A API publica versão mínima e versão atual.
- Client abaixo da mínima só é barrado em **nova entrada**.
- Quem já está em call permanece.
- Ao sair, a próxima entrada usa o client novo.
- Breaking change: novas entradas naquela sala exigem a versão nova; quem já está segue até sair.

---

## 10. Telas do MVP

1. **Onboarding (uma vez):** nickname.
2. **Home:** lista de **servidores** só na sidebar (título estático; card **Adicionar servidor** no topo; bookmarks abaixo); centro = empty ou o servidor aberto; Criar / Entrar no centro. Home / outro servidor / configurações (áudio ou do servidor) não encerram a call.
3. **Criar servidor:** no centro da home; nome → código + copiar → “Entrar no servidor”.
4. **Servidor:** árvore tipo TS3 + chat embaixo; clique no nick abre ficha. Engrenagem no título abre as **configurações do servidor**. Admin/dono gerencia cada **sala** numa ficha (renomear, excluir, nova no fim). Só eles arrastam os outros. Altura do chat arrastável. Mute/config na sidebar.
5. Trocar de servidor pela lista, com o mesmo usuário.
6. **Configurações:** abas **Áudio** e **Conta**. Áudio: dispositivos, medidor, ganho, automático/PTT, atalho de mudo (vale em todos os servidores). Conta: nickname, código de recuperação (copiar + aviso) e **Sair deste PC**.
7. **Configurações do servidor:** engrenagem para todo mundo. Nome, código, data, membros (você no topo; cargo por último). Promover: dono e admin. Excluir/bloquear membro: dono e admin; excluir/bloquear admin: só dono (mock). No fim: **Sair do servidor** (membro/admin; confirmar). Plano/expiração depois.

Visual: escuro, poucos botões, janela de app.

---

## 11. API (Go) — o que fazer

**HTTP**

- `POST /api/identity` — `{ nickname }` gera uid + código (hash no banco, código na resposta); `{ uid, nickname, recoveryCode }` sincroniza um PC que já tinha identidade local
- `POST /api/identity/restore` — `{ code }` → uid, nick, servidores em que o uid ainda é membro (sem devolver o código; no banco só o hash)
- `POST` criar sala (nome + uid + nickname) → sala + código + canal Geral + owner
- `POST` entrar por código (recusa se o `uid` está em `blocked`)
- `POST` reentrar (uid já membro)
- `POST /api/rooms/{id}/leave` — `{ uid }` membro ou admin; dono 403. Some de `members`; não mexe em `blocked`
- `GET` servidor (membro) → nome, código, criado em, papel, membros
- `PATCH` servidor (dono/admin) → nome
- canais: listar; admin cria/apaga
- promover admin
- `GET` versão mínima do client

**WebSocket**

- presença na sala / no canal
- heartbeat do host
- anúncio de sucessor
- sinalização WebRTC (offer, answer, ICE)
- eventos: entrou/saiu do canal, mute (ícone remoto), promoveu admin

**Postgres**

- `users` — uid, nickname, recovery_code_hash, created_at
- `rooms` — id, name, code, owner_uid, created_at
- `channels` — id, room_id, name
- `members` — room_id, uid, nickname, role (`owner` | `admin` | `member`)
- `blocked` — room_id, uid, nickname, created_at (sair não apaga; entrar recusa)

O `uid` do client é o mesmo gravado em `users`, `rooms.owner_uid` e `members.uid`. Não há e-mail/senha. Código de recuperação **não** é o código do servidor; no banco só o hash.  
`plan` / `expires_at` e renovação (qualquer um paga) entram **depois** do MVP.

---

## 12. Client (React) — o que fazer

- Ler identidade no `localStorage` (web) / disco (Tauri depois). Código novo vem da API; o client só guarda e mostra. Identidade antiga sem código ainda gera um localmente, até o sync.
- Bookmarks no mesmo armazenamento local; restore preenche a lista a partir do banco.
- UI das telas acima.
- `getUserMedia` + `RTCPeerConnection` por canal.
- Checar versão mínima antes de conectar.
- HTTP + WebSocket com a API.

No MVP o app é o navegador. Tauri empacota a **mesma UI** depois.

---

## 13. Ordem de implementação (MVP)

| #   | Entrega                                        | Pronto quando                                               |
| --- | ---------------------------------------------- | ----------------------------------------------------------- |
| 0   | Pastas `api/` + `client/` + Postgres no Docker | `compose up` sobe o banco; `go run` no `/health`; Vite abre |
| 1   | Identidade no client                           | nickname na 1ª vez; uid persistido                          |
| 2   | Criar / entrar sala (HTTP)                     | código gerado; owner no banco; bookmark local; auto-join    |
| 3   | Tela da sala + canal Geral                     | árvore; lista de membros via WS                             |
| 4   | Canais extras                                  | qualquer um entra; dono promove admin; admin move gente     |
| 5   | WebRTC no canal                                | 2 pessoas falam no Geral                                    |
| 6   | Troca de canal = outro P2P                     | 3ª pessoa em outro canal fica só naquele                    |
| 7   | Host + sucessor                                | se o host sair, a call continua                             |
| 8   | Áudio básico                                   | mute, deafen, falando, volume local; teto 8–12              |
| 9   | Gate de versão                                 | entrada nova exige client atual; call atual segue           |
| 10  | Polimento de UI                                | fluxo contínuo nick → sala → falar                          |

Depois do item 10 o MVP web está fechado. **Tauri** vem na sequência.

---

## 14. Depois do MVP

### App desktop

- Tauri (Windows primeiro), build fora do WSL
- bandeja, instalador, identidade/bookmarks em AppData
- girar código de recuperação se vazou

### Rede

- coturn (TURN)
- eleição de host por ping / tipo de NAT / upload
- dual-host se o sucessor ainda engasgar

### Moderação e sala

- kick / ban: dono e admin em **membro**; só o dono em **admin**
- invalidar / girar código
- senha por canal, canal privado
- apagar sala, transferir owner
- privilege key estilo TS

### Cobrança (depois do MVP)

- planos 1 / 3 / 12 meses na **criação da sala**
- sala vencida → tela de renovar; **qualquer um** pode pagar
- status do plano (ativo / tempo restante) nas **configurações do servidor**

### Comunicação extra (no mesmo canal)

- chat de texto (canal + sala)
- **Streaming (depois do MVP), P2P em árvore:** o streamer **não** manda uma cópia para cada um. Elege **2–3 relés** (boa NAT/upload, de preferência quem não está no jogo pesado). Relé **só encaminha** o pacote já codificado — sem decodificar/recodificar. O resto assiste no segundo salto. Até **12** no canal podem ver.
- Se um relé cair: sucessor já escolhido (igual voz). Máximo **2 saltos**.
- Voz continua no host do canal — não mistura com vídeo.
- Até **2 streams** por canal. Qualidade: **720p 30fps** padrão. **1080p 30fps** só se a árvore estiver folgada. Sem 60fps.

### UX de jogo

- overlay
- PTT global (hotkey com o jogo em foco)
- AFK channel automático
- canais temporários

### Motor de áudio

- Rust no pipeline de voz se a CPU in-game pedir

---

## 15. Custos

| Item           | MVP                                         | Depois                                         |
| -------------- | ------------------------------------------- | ---------------------------------------------- |
| VPS + Postgres | um droplet para sinalização de muitas salas | crescer se o WebSocket lotar                   |
| STUN           | público                                     | —                                              |
| TURN           | —                                           | coturn no VPS; banda pesa de verdade com vídeo |

---

## 16. Escopo do MVP

- [x] Go + Postgres + React/Vite
- [x] Identidade local (nick + uid)
- [x] Criar sala com nome → código; auto-join; creator = owner/admin
- [x] Entrar com código; bookmarks só no PC
- [x] Canais; cada um P2P; host + sucessor
- [x] Admin cria canal e promove
- [x] Teto 8–12 por canal
- [x] Update: trava no entrar; call atual segue

O restante está na seção 14.

---

## 17. Próxima ação

Presença real (WebSocket) — item **3** da seção 13.
