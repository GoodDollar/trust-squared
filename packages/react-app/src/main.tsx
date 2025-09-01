import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient } from "@tanstack/react-query";
import App from "./App.tsx";

import "./index.css";
import MiniPayProvider from "./providers/minipayProvider.tsx";

// Create a client
const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MiniPayProvider queryClient={queryClient}>
      {/* <Toaster /> */}
      <App />
    </MiniPayProvider>
  </StrictMode>
);

