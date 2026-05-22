import { ShieldAlert } from "lucide-react";

export function PrivacyNotice() {
  return (
    <div className="flex items-start gap-3 border border-[#d8c8b8] bg-[#fbfaf7] px-4 py-3 text-[#4a4038]">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#9a3e33]" />
      <p className="text-base leading-6">
        Use public sources or sanitized notes only. Do not upload confidential, export-controlled, proprietary, privileged, or security-sensitive material.
      </p>
    </div>
  );
}
