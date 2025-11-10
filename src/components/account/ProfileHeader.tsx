import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";
import type { UserDto } from "../../types";

interface ProfileHeaderProps {
  user: UserDto;
}

/**
 * ProfileHeader - Displays basic user information (email, creation date)
 * Serves as identity confirmation before making changes
 */
export function ProfileHeader({ user }: ProfileHeaderProps) {
  // Get user initials from email
  const getInitials = (email?: string): string => {
    if (!email) return "U";
    const parts = email.split("@")[0].split(".");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email[0].toUpperCase();
  };

  // Format creation date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("pl-PL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 pb-6 border-b">
      <Avatar className="size-16 md:size-20">
        <AvatarFallback className="bg-primary text-primary-foreground text-lg md:text-xl">
          {user.email ? getInitials(user.email) : <User className="size-8" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Twój profil</h1>
        {user.email && (
          <p className="text-muted-foreground text-sm md:text-base mb-1">
            <span className="font-medium">E-mail:</span> {user.email}
          </p>
        )}
        <p className="text-muted-foreground text-xs md:text-sm">
          <span className="font-medium">Data utworzenia konta:</span> {formatDate(user.createdAt)}
        </p>
      </div>
    </div>
  );
}
