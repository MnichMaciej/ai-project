import { Toaster } from "@/components/ui/sonner";

/**
 * ToasterProvider - wrapper component for Sonner toast notifications
 * Should be placed at the root level of the application
 */
export function ToasterProvider() {
  return <Toaster position="top-center" />;
}
