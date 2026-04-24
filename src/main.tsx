import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setupServiceWorker } from "./lib/registerSW";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker (no-op inside Lovable preview iframe)
setupServiceWorker();
