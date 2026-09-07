import { useState } from "react";
import { loadIdentity } from "./identity";
import { HomeScreen } from "./screens/home";
import { NicknameScreen } from "./screens/nickname";

export default function App() {
  const [identity, setIdentity] = useState(loadIdentity);

  if (!identity) {
    return (
      <NicknameScreen
        onCreated={() => {
          setIdentity(loadIdentity());
        }}
      />
    );
  }

  return <HomeScreen identity={identity} onNicknameChange={setIdentity} />;
}
