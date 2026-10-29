import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "../third_party/98.css/98.css";
import "./style.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
