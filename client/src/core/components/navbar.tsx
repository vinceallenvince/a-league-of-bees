import * as React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/core/providers/auth-provider";
import { useTranslation } from "react-i18next";
import { Button } from "@/core/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/core/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/ui/dropdown-menu";
import { User } from "lucide-react";
import LanguageSwitcher from "./language-switcher";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const { t } = useTranslation();

  return (
    <nav className="border-b" role="navigation" aria-label="Main navigation">
      <div className="container h-16 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link 
            href="/" 
            className={location.pathname === "/" ? "text-foreground font-bold" : "text-muted-foreground font-normal"}
            aria-current={location.pathname === "/" ? "page" : undefined}
          >
            {t('navigation.home')}
          </Link>
          
          {/* Hello World link moved to authenticated user section */}
          
          {user && (
            // Authenticated user links
            <>
              <Link 
                href="/hello-world" 
                className={location.pathname === "/hello-world" ? "text-foreground font-bold" : "text-muted-foreground font-normal"}
                aria-current={location.pathname === "/hello-world" ? "page" : undefined}
              >
                {t('navigation.helloWorld', 'Hello World')}
              </Link>
              
              {user.isAdmin && (
                <Link 
                  href="/admin" 
                  className={location.pathname === "/admin" ? "text-foreground font-bold" : "text-muted-foreground font-normal"}
                  aria-current={location.pathname === "/admin" ? "page" : undefined}
                >
                  {t('navigation.admin')}
                </Link>
              )}
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Language switcher - positioned to the left of profile for authenticated users */}
          {/* and to the left of sign in button for non-authenticated users */}
          <LanguageSwitcher />
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-10 w-10 rounded-full"
                  aria-label="User menu"
                >
                  <Avatar>
                    <AvatarImage src={user.avatar || undefined} alt="" />
                    <AvatarFallback>
                      <User className="h-4 w-4" aria-hidden="true" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" aria-label="User menu options">
                <DropdownMenuItem asChild>
                  <Link href="/profile">{t('navigation.profile')}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => logoutMutation.mutate()}
                >
                  {t('navigation.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Sign In button for non-authenticated users
            <Button asChild variant="default" size="sm">
              <Link 
                href="/auth" 
                className="text-primary-foreground"
                aria-current={location.pathname === "/auth" ? "page" : undefined}
              >
                {t('navigation.signIn')}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}