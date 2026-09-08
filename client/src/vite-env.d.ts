/// <reference types="vite/client" />

interface AudioContext {
  setSinkId?(sinkId: string): Promise<void>;
}
