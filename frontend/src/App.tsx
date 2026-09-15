import TransportBar from "./components/TransportBar";
import TrackList from "./components/TrackList";
import PianoRoll from "./components/PianoRoll";
import VelocityLane from "./components/VelocityLane";
import ChordPanel from "./components/ChordPanel";
import SettingsPanel from "./components/SettingsPanel";
import ChatPanel from "./components/ChatPanel";
import { usePersistence } from "./hooks/usePersistence";
import { useUndoShortcuts } from "./hooks/useUndoShortcuts";
import { colors } from "./styles/theme";

export default function App() {
  usePersistence();
  useUndoShortcuts();
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: colors.bg }}>
      <TransportBar />
      <div style={{ padding: "12px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        <ChordPanel />
        <SettingsPanel />
      </div>
      <div style={{ flex: 1, display: "flex", gap: 12, padding: 16, minHeight: 0 }}>
        <TrackList />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, boxShadow: colors.shadow, overflow: "hidden" }}>
          <PianoRoll />
          <VelocityLane />
        </div>
        <ChatPanel />
      </div>
    </div>
  );
}
