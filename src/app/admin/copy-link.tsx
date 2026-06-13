"use client";

import { useState } from "react";

export function CopyLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn-secondary py-1.5 text-xs"
      onClick={async () => {
        const url = `${window.location.origin}${path}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? "Copiado!" : "Copiar link"}
    </button>
  );
}
