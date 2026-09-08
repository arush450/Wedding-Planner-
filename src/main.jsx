import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import RsvpPage from "./RsvpPage.jsx";

// Guests reach the RSVP page via a link/QR code ending in #rsvp.
// Everyone else sees the full planner.
const isRsvpPage = window.location.hash.startsWith("#rsvp");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isRsvpPage ? <RsvpPage /> : <App />}
  </React.StrictMode>
);
