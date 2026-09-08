import { useEffect, useState } from "react";
import { registerIdentity } from "./api";
import { clearBookmarks } from "./bookmarks";
import { clearIdentity, loadIdentity, saveIdentity } from "./identity";
import { HomeScreen } from "./screens/home";
import { NicknameScreen } from "./screens/nickname";

export default function App() {
  const [identity, setIdentity] = useState(loadIdentity);
  const [identityReady, setIdentityReady] = useState(false);

  useEffect(() => {
    if (!identity) {
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
  }, [identity]);

  function handleLogout() {
    clearIdentity();
    clearBookmarks();
    setIdentity(null);
  }

  if (!identity) {
    return <NicknameScreen onReady={setIdentity} />;
  }

  if (!identityReady) return null;

  return (
    <HomeScreen
      identity={identity}
      onNicknameChange={setIdentity}
      onLogout={handleLogout}
    />
  );
}
