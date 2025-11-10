import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { DeleteAccountModal } from "./DeleteAccountModal";

interface DeleteAccountSectionProps {
  onDelete: () => Promise<void>;
}

/**
 * DeleteAccountSection - Section with warning and button to delete account
 * Displays info about consequences (deletion of projects)
 */
export function DeleteAccountSection({ onDelete }: DeleteAccountSectionProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleConfirm = async () => {
    try {
      await onDelete();
      setIsModalOpen(false);
    } catch {
      // Error handling is done in the hook
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Niebezpieczna strefa</CardTitle>
          <CardDescription>Trwałe usunięcie konta i wszystkich powiązanych danych</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription>
              Usunięcie konta jest nieodwracalne. Wszystkie Twoje projekty zostaną trwale usunięte wraz z kontem.
            </AlertDescription>
          </Alert>
          <Button variant="destructive" onClick={handleOpenModal} className="w-full md:w-auto min-h-[44px]">
            <AlertTriangle className="size-4 mr-2" />
            Usuń konto
          </Button>
        </CardContent>
      </Card>

      <DeleteAccountModal isOpen={isModalOpen} onClose={handleCloseModal} onConfirm={handleConfirm} />
    </>
  );
}
