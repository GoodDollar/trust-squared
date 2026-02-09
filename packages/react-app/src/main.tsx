import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

import "./index.css";
import WalletProvider from "./providers/dynamic.tsx"; 
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WalletProvider>
      {/* <Toaster /> */}
      <App />
    </WalletProvider>
  </StrictMode>
);

