import { useEffect, useState } from "react";
import { fetchClientVersion, registerIdentity } from "./api";
import { clearBookmarks } from "./bookmarks";
import { clearContacts } from "./contacts";
import { clearIdentity, loadIdentity, saveIdentity } from "./identity";
import { WorkspaceScreen } from "./screens/workspace";
import { HomeScreen } from "./screens/home";
import { NicknameScreen } from "./screens/nickname";
import { UpdateScreen } from "./screens/update";
import {
  CLIENT_VERSION,
  versionBelow,
  type ClientVersionInfo,
} from "./version";

export default function App() {
  const [identity, setIdentity] = useState(loadIdentity);
  const [identityReady, setIdentityReady] = useState(false);
  const [openServerId, setOpenServerId] = useState<string | null>(null);
  const [gate, setGate] = useState<"loading" | "ok" | "outdated">("loading");
  const [versionInfo, setVersionInfo] = useState<ClientVersionInfo | null>(
    null,
  );

  function handleLogout() {
    clearIdentity();
    clearBookmarks();
    clearContacts();
    setOpenServerId(null);
    setIdentity(null);
  }

  useEffect(() => {
    let cancelled = false;
    const preview = new URLSearchParams(window.location.search).has(
      "desatualizado",
    );
    void fetchClientVersion()
      .then((info) => {
        if (cancelled) return;
        if (preview) {
          setVersionInfo({ min: "0.0.2", current: "0.0.2" });
          setGate("outdated");
          return;
        }
        setVersionInfo(info);
        setGate(versionBelow(CLIENT_VERSION, info.min) ? "outdated" : "ok");
      })
      .catch(() => {
        if (cancelled) return;
        if (preview) {
          setVersionInfo({ min: "0.0.2", current: "0.0.2" });
          setGate("outdated");
          return;
        }
        setGate("ok");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!identity || gate !== "ok") {
      setIdentityReady(false);
      return;
    }
    let cancelled = false;
    void registerIdentity({
      uid: identity.uid,
      nickname: identity.nickname,
      recoveryCode: identity.recoveryCode,
    })
      .then((registered) => {
        if (cancelled) return;
        if (registered.recoveryCode === identity.recoveryCode) return;
        const next = { ...identity, recoveryCode: registered.recoveryCode };
        saveIdentity(next);
        setIdentity(next);
      })
      .catch(() => {
        /* API fora: segue neste PC */
      })
      .finally(() => {
        if (!cancelled) setIdentityReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [identity, gate]);

  if (gate === "loading") return null;
  if (gate === "outdated" && versionInfo) {
    return <UpdateScreen info={versionInfo} />;
  }

  if (!identity) {
    return <NicknameScreen onReady={setIdentity} />;
  }

  if (!identityReady) return null;

  if (openServerId) {
    return (
      <WorkspaceScreen
        roomId={openServerId}
        identity={identity}
        onNicknameChange={setIdentity}
        onLogout={handleLogout}
        onBack={() => setOpenServerId(null)}
        onSwitchServer={setOpenServerId}
      />
    );
  }

  return (
    <HomeScreen
      identity={identity}
      onNicknameChange={setIdentity}
      onOpenServer={setOpenServerId}
    />
  );
}
