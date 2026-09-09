import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent,
} from "react";
import {
  salaActivity,
  subscribeActivity,
  type ActivityLine,
} from "../../../../activity";
import {
  CHAT_TEXT_MAX,
  salaLog,
  sendChat,
  subscribeChat,
  type ChatLine as ChatLogLine,
} from "../../../../chat";
import type { Identity } from "../../../../identity";
import { playPokeSound } from "../../../../sounds";
import {
  Chat,
  ChatClose,
  ChatCollapse,
  ChatDay,
  ChatForm,
  ChatHead,
  ChatInput,
  ChatLine,
  ChatLog,
  ChatNick,
  ChatSend,
  ChatTab,
  ChatTabLabel,
  ChatTabs,
  ChatTime,
  Splitter,
} from "./style";

type ChatMessage = {
  id: string;
  uid: string;
  nick: string;
  text: string;
  at: number;
};

type SalaFeedLine =
  | { kind: "chat"; id: string; at: number; uid: string; nick: string; text: string }
  | { kind: "log"; id: string; at: number; text: string };

type ChatDaySep = { kind: "day"; id: string; label: string };

type DirectThread = {
  nick: string;
  lines: ChatMessage[];
  draft: string;
  unread?: boolean;
};

export type WorkspaceChatHandle = {
  openDirect: (input: { userId: string; nick: string }) => void;
};

type WorkspaceChatProps = {
  roomId: string;
  channelId: string | null;
  channelName?: string | null;
  identity: Identity;
  deafened: boolean;
};

const CHAT_MIN = 120;
const CHAT_STAGE_MIN = 140;
const CHAT_HEIGHT_KEY = "voice.chatHeight";

function loadChatHeight() {
  const stored = Number(window.localStorage.getItem(CHAT_HEIGHT_KEY));
  if (Number.isFinite(stored) && stored >= CHAT_MIN) return stored;
  return null;
}

function saveChatHeight(height: number) {
  window.localStorage.setItem(CHAT_HEIGHT_KEY, String(Math.round(height)));
}

function mergeSalaFeed(
  chat: ChatLogLine[],
  logs: ActivityLine[],
): SalaFeedLine[] {
  const rows: SalaFeedLine[] = [
    ...logs.map((line) => ({
      kind: "log" as const,
      id: `log:${line.id}`,
      at: line.at,
      text: line.text,
    })),
    ...chat.map((line) => ({
      kind: "chat" as const,
      id: `chat:${line.id}`,
      at: line.at,
      uid: line.uid,
      nick: line.nick,
      text: line.text,
    })),
  ];
  rows.sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
  return rows;
}

function formatChatClock(at: number): string | null {
  if (!at || !Number.isFinite(at) || at <= 0) return null;
  return new Date(at).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function ChatStamp({ at }: { at: number }) {
  const clock = formatChatClock(at);
  if (!clock) return null;
  return <ChatTime>{clock} - </ChatTime>;
}

function dayKey(at: number): string {
  if (!at || !Number.isFinite(at) || at <= 0) return "";
  const d = new Date(at);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function startOfLocalDay(at: number): number {
  const d = new Date(at);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function formatChatDay(at: number): string {
  const day = startOfLocalDay(at);
  const today = startOfLocalDay(Date.now());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (day === today) return "Hoje";
  if (day === yesterday.getTime()) return "Ontem";
  const date = new Date(at);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

function withChatDays<T extends { id: string; at: number }>(
  lines: T[],
): Array<ChatDaySep | T> {
  const rows: Array<ChatDaySep | T> = [];
  let last = "";
  for (const line of lines) {
    const key = dayKey(line.at);
    if (key && key !== last) {
      last = key;
      rows.push({ kind: "day", id: `day:${key}`, label: formatChatDay(line.at) });
    }
    rows.push(line);
  }
  return rows;
}

function isChatDay(
  row: ChatDaySep | { id: string; at: number },
): row is ChatDaySep {
  return "kind" in row && row.kind === "day";
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.2 6 8 10.8 12.8 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const WorkspaceChat = forwardRef<WorkspaceChatHandle, WorkspaceChatProps>(
  function WorkspaceChat(
    { roomId, channelId, channelName, identity, deafened },
    ref,
  ) {
    const [chatTab, setChatTab] = useState("sala");
    const [directs, setDirects] = useState<Record<string, DirectThread>>({});
    const [salaLines, setSalaLines] = useState<ChatLogLine[]>([]);
    const [activityLines, setActivityLines] = useState<ActivityLine[]>([]);
    const [draft, setDraft] = useState("");
    const [chatHeight, setChatHeight] = useState<number | null>(loadChatHeight);
    const [collapsed, setCollapsed] = useState(false);
    const paneRef = useRef<HTMLDivElement>(null);
    const chatRef = useRef<HTMLElement>(null);
    const chatHeightRef = useRef(chatHeight);
    const dragRef = useRef<{ startY: number; startH: number } | null>(null);
    const channelIdRef = useRef(channelId);
    const chatTabRef = useRef(chatTab);
    const deafenedRef = useRef(deafened);
    chatHeightRef.current = chatHeight;
    channelIdRef.current = channelId;
    chatTabRef.current = chatTab;
    deafenedRef.current = deafened;

    useImperativeHandle(ref, () => ({
      openDirect({ userId, nick }) {
        setDirects((prev) => {
          const existing = prev[userId];
          return {
            ...prev,
            [userId]: {
              nick,
              draft: existing?.draft ?? "",
              lines: existing?.lines ?? [],
              unread: false,
            },
          };
        });
        setChatTab(userId);
        setCollapsed(false);
      },
    }));

    function selectTab(id: string) {
      setChatTab(id);
      setCollapsed(false);
    }

    useEffect(() => {
      if (!channelId) {
        setSalaLines([]);
        setActivityLines([]);
        setDraft("");
        return;
      }
      setSalaLines(salaLog(roomId, channelId));
      setActivityLines(salaActivity(roomId, channelId));
    }, [roomId, channelId]);

    useEffect(() => {
      return subscribeActivity((event) => {
        if (event.roomId !== roomId) return;
        const seated = channelIdRef.current;
        if (!seated) return;
        if (event.type === "log.sala" && event.channelId !== seated) return;
        setActivityLines(salaActivity(roomId, seated));
      });
    }, [roomId]);

    useEffect(() => {
      return subscribeChat((event) => {
        if (event.roomId !== roomId) return;

        if (event.type === "chat.sala") {
          if (event.channelId === channelIdRef.current) {
            setSalaLines(salaLog(roomId, event.channelId));
          }
          return;
        }

        const peerId = event.uid === identity.uid ? event.to : event.uid;
        const peerNick =
          event.uid === identity.uid ? event.toNickname : event.nickname;
        const line: ChatMessage = {
          id: event.id,
          uid: event.uid,
          nick: event.nickname,
          text: event.text,
          at: event.at,
        };
        setDirects((prev) => {
          const existing = prev[peerId];
          if (existing?.lines.some((item) => item.id === line.id)) return prev;
          const viewing = chatTabRef.current === peerId;
          return {
            ...prev,
            [peerId]: {
              nick: peerNick,
              draft: existing?.draft ?? "",
              lines: [...(existing?.lines ?? []), line],
              unread: viewing
                ? false
                : event.uid !== identity.uid
                  ? true
                  : Boolean(existing?.unread),
            },
          };
        });
        if (event.uid !== identity.uid && !deafenedRef.current) {
          playPokeSound();
        }
      });
    }, [roomId, identity.uid]);

    useEffect(() => {
      if (chatTab === "sala") return;
      setDirects((prev) => {
        const existing = prev[chatTab];
        if (!existing?.unread) return prev;
        return { ...prev, [chatTab]: { ...existing, unread: false } };
      });
    }, [chatTab]);

    const salaFeed = channelId ? mergeSalaFeed(salaLines, activityLines) : [];
    const direct = chatTab !== "sala" ? (directs[chatTab] ?? null) : null;
    const seatedName = channelName?.trim() || null;

    function handleDirect(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      if (!direct) return;
      const text = direct.draft.trim().slice(0, CHAT_TEXT_MAX);
      if (!text) return;
      sendChat({
        type: "chat.direct",
        roomId,
        uid: chatTab,
        id: crypto.randomUUID(),
        text,
      });
      setDirects((prev) => {
        const existing = prev[chatTab];
        if (!existing) return prev;
        return {
          ...prev,
          [chatTab]: { ...existing, draft: "" },
        };
      });
    }

    function closeDirect(userId: string) {
      setDirects((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      if (chatTab === userId) setChatTab("sala");
    }

    function handleChat(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      const text = draft.trim().slice(0, CHAT_TEXT_MAX);
      if (!channelId || !text) return;

      sendChat({
        type: "chat.sala",
        roomId,
        channelId,
        id: crypto.randomUUID(),
        text,
      });
      setDraft("");
    }

    function clampChatHeight(next: number) {
      const pane = paneRef.current?.parentElement;
      const max = pane
        ? Math.max(CHAT_MIN, pane.clientHeight - CHAT_STAGE_MIN - 24)
        : 420;
      return Math.min(max, Math.max(CHAT_MIN, next));
    }

    function handleSplitDown(event: PointerEvent<HTMLDivElement>) {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      const startH =
        chatHeight ?? chatRef.current?.getBoundingClientRect().height ?? 184;
      dragRef.current = { startY: event.clientY, startH };
    }

    function handleSplitMove(event: PointerEvent<HTMLDivElement>) {
      if (!dragRef.current) return;
      const next = clampChatHeight(
        dragRef.current.startH + (dragRef.current.startY - event.clientY),
      );
      chatHeightRef.current = next;
      setChatHeight(next);
    }

    function handleSplitUp() {
      if (!dragRef.current) return;
      dragRef.current = null;
      if (chatHeightRef.current != null) saveChatHeight(chatHeightRef.current);
    }

    return (
      <div ref={paneRef} style={{ display: "contents" }}>
        {!collapsed ? (
          <Splitter
            role="separator"
            aria-orientation="horizontal"
            aria-label="Redimensionar chat"
            onPointerDown={handleSplitDown}
            onPointerMove={handleSplitMove}
            onPointerUp={handleSplitUp}
            onPointerCancel={handleSplitUp}
          />
        ) : null}

        <Chat
          ref={chatRef}
          $collapsed={collapsed}
          $height={chatHeight ?? undefined}
        >
          <ChatHead $collapsed={collapsed}>
            <ChatTabs>
              <ChatTab
                $active={chatTab === "sala"}
                title={seatedName ? `Chat · ${seatedName}` : "Chat"}
                onClick={() => selectTab("sala")}
              >
                <ChatTabLabel>
                  {seatedName ? `Chat · ${seatedName}` : "Chat"}
                </ChatTabLabel>
              </ChatTab>
              {Object.entries(directs).map(([id, thread]) => (
                <ChatTab
                  key={id}
                  $active={chatTab === id}
                  $unread={chatTab !== id && Boolean(thread.unread)}
                  title={thread.nick}
                  onClick={() => selectTab(id)}
                >
                  <ChatTabLabel>{thread.nick}</ChatTabLabel>
                  <ChatClose
                    type="button"
                    title="Fechar conversa"
                    onClick={(event) => {
                      event.stopPropagation();
                      closeDirect(id);
                    }}
                  >
                    <CloseIcon />
                  </ChatClose>
                </ChatTab>
              ))}
            </ChatTabs>
            <ChatCollapse
              type="button"
              $collapsed={collapsed}
              title={collapsed ? "Expandir chat" : "Ocultar chat"}
              aria-label={collapsed ? "Expandir chat" : "Ocultar chat"}
              aria-expanded={!collapsed}
              onClick={() => setCollapsed((prev) => !prev)}
            >
              <CollapseIcon />
            </ChatCollapse>
          </ChatHead>
          {!collapsed ? (
            direct ? (
              <>
                <ChatLog>
                  {withChatDays(direct.lines).map((row) =>
                    isChatDay(row) ? (
                      <ChatDay key={row.id}>{row.label}</ChatDay>
                    ) : (
                      <ChatLine key={row.id}>
                        <ChatStamp at={row.at} />
                        <ChatNick $you={row.uid === identity.uid}>
                          {row.nick}:
                        </ChatNick>{" "}
                        {row.text}
                      </ChatLine>
                    ),
                  )}
                </ChatLog>
                <ChatForm onSubmit={handleDirect}>
                  <ChatInput
                    value={direct.draft}
                    maxLength={CHAT_TEXT_MAX}
                    placeholder={`Mensagem para ${direct.nick}`}
                    onChange={(event) =>
                      setDirects((prev) => {
                        const existing = prev[chatTab];
                        if (!existing) return prev;
                        return {
                          ...prev,
                          [chatTab]: { ...existing, draft: event.target.value },
                        };
                      })
                    }
                  />
                  <ChatSend type="submit" disabled={!direct.draft.trim()}>
                    Enviar
                  </ChatSend>
                </ChatForm>
              </>
            ) : (
              <>
                <ChatLog>
                  {!channelId ? (
                    <ChatLine $log>Entre em uma sala para conversar.</ChatLine>
                  ) : salaFeed.length === 0 ? (
                    <ChatLine $log>Nenhuma mensagem neste canal.</ChatLine>
                  ) : (
                    withChatDays(salaFeed).map((row) =>
                      isChatDay(row) ? (
                        <ChatDay key={row.id}>{row.label}</ChatDay>
                      ) : row.kind === "log" ? (
                        <ChatLine key={row.id} $log>
                          <ChatStamp at={row.at} />
                          {row.text}
                        </ChatLine>
                      ) : (
                        <ChatLine key={row.id}>
                          <ChatStamp at={row.at} />
                          <ChatNick $you={row.uid === identity.uid}>
                            {row.nick}:
                          </ChatNick>{" "}
                          {row.text}
                        </ChatLine>
                      ),
                    )
                  )}
                </ChatLog>
                <ChatForm onSubmit={handleChat}>
                  <ChatInput
                    value={draft}
                    disabled={!channelId}
                    maxLength={CHAT_TEXT_MAX}
                    placeholder={
                      seatedName
                        ? `Mensagem em ${seatedName}`
                        : "Entre numa sala para conversar"
                    }
                    onChange={(event) => setDraft(event.target.value)}
                  />
                  <ChatSend type="submit" disabled={!channelId}>
                    Enviar
                  </ChatSend>
                </ChatForm>
              </>
            )
          ) : null}
        </Chat>
      </div>
    );
  },
);
