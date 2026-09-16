import TransportBar from "./components/TransportBar";
import TrackList from "./components/TrackList";
import PianoRoll from "./components/PianoRoll";
import VelocityLane from "./components/VelocityLane";
import ChordPanel from "./components/ChordPanel";
import SettingsPanel from "./components/SettingsPanel";
import ChatPanel from "./components/ChatPanel";
import { usePersistence } from "./hooks/usePersistence";
import { useUndoShortcuts } from "./hooks/useUndoShortcuts";
import styles from "./App.module.css";

export default function App() {
  usePersistence();
  useUndoShortcuts();
  return (
    <div className={styles.app}>
      <TransportBar />
      <div className={styles.topStack}>
        <ChordPanel />
        <SettingsPanel />
      </div>
      <div className={styles.workspace}>
        <TrackList />
        <div className={styles.pianoCard}>
          <PianoRoll />
          <VelocityLane />
        </div>
        <ChatPanel />
      </div>
    </div>
  );
}
