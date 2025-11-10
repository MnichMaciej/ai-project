import React from "react";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { DeleteAccountSection } from "./DeleteAccountSection";
import { useAccountManagement } from "../../lib/hooks/useAccountManagement";

/**
 * AccountSettings - Container for account management options
 * Responsive: tabs on desktop, accordion on mobile
 */
export function AccountSettings() {
  const { deleteAccount } = useAccountManagement();

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <ChangePasswordForm onSuccess={() => {}} />
      </div>
      <div className="space-y-4">
        <DeleteAccountSection onDelete={deleteAccount} />
      </div>
    </div>
  );
}
