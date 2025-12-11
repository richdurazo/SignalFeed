"use client";

import { useEffect } from "react";

/**
 * Global error handler to suppress harmless browser extension errors
 * These errors are caused by browser extensions injecting scripts and don't affect app functionality
 */
export function GlobalErrorHandler() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.message || "";
      
      // Suppress known browser extension errors that don't affect functionality
      const extensionErrors = [
        "A listener indicated an asynchronous response by returning true",
        "message channel closed",
        "Extension context invalidated",
        "Receiving end does not exist",
      ];

      const isExtensionError = extensionErrors.some((errorText) =>
        errorMessage.includes(errorText)
      );

      if (isExtensionError) {
        // Prevent the error from appearing in console
        event.preventDefault();
        // Optionally log in development for debugging
        if (process.env.NODE_ENV === "development") {
          console.debug("Suppressed browser extension error:", errorMessage);
        }
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || String(event.reason || "");
      
      const extensionErrors = [
        "A listener indicated an asynchronous response by returning true",
        "message channel closed",
        "Extension context invalidated",
        "Receiving end does not exist",
      ];

      const isExtensionError = extensionErrors.some((errorText) =>
        reason.includes(errorText)
      );

      if (isExtensionError) {
        event.preventDefault();
        if (process.env.NODE_ENV === "development") {
          console.debug("Suppressed browser extension promise rejection:", reason);
        }
        return false;
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}

