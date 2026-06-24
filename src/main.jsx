import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

// Register service worker for PWA/offline support
// updateSW() can be called to force update when a new version is available
const updateSW = registerSW({
  onNeedRefresh() {
    // Show a "new version available" prompt if desired
    // For now we silently auto-update
    updateSW(true);
  },
  onOfflineReady() {
    console.log("অ্যাপ অফলাইন ব্যবহারের জন্য প্রস্তুত");
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
