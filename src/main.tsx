import React from "react";
import ReactDOM from "react-dom/client";
import { getSiteSubdomain } from "./lib/host";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root")!);
const subdomain = getSiteSubdomain();

if (subdomain) {
  // An author's published site (<name>.<root domain>): only the page itself. The normal app, Clerk, the
  // layout, the push / install / welcome prompts are never loaded, so none of them can start.
  import("./pages/PublishedSite").then(({ default: PublishedSite }) =>
    root.render(
      <React.StrictMode>
        <PublishedSite subdomain={subdomain} />
      </React.StrictMode>
    )
  );
} else {
  import("./MainApp").then(({ default: MainApp }) =>
    root.render(
      <React.StrictMode>
        <MainApp />
      </React.StrictMode>
    )
  );
}
