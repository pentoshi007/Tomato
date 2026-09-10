import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AppProvider } from "./context/AppContext.tsx";
import { SocketProvider } from "./context/SocketContext.tsx";
import { DemoProvider } from "./demo/DemoProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <DemoProvider>
        <AppProvider>
          <SocketProvider>
            <App />
          </SocketProvider>
        </AppProvider>
      </DemoProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
