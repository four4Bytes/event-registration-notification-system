"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FaBars, FaUser } from "react-icons/fa6";

import { useSidebar } from "@/components/layout/Sidebar/sidebar-context";
import { Button } from "@/components/ui/Button/Button";
import { SignOutButton } from "@/features/auth/components/SignOutButton/SignOutButton";
import { roleLabels } from "@/features/users/constants";
import type { Role } from "@/generated/prisma/browser";

import styles from "./Header.module.css";

interface HeaderProps {
  userImage: string | null;
  userName?: string | null;
  userRole?: Role | null;
}

export function Header({ userImage, userName, userRole }: HeaderProps) {
  const pathname = usePathname();
  const [imgError, setImgError] = useState(false);
  const { toggle } = useSidebar();

  const getPageTitle = (path: string) => {
    if (path.startsWith("/events")) return "Events";
    if (path.startsWith("/notifications")) return "Notifications";
    if (path.startsWith("/admin/users")) return "Manage Users";
    if (path.startsWith("/admin/clubs")) return "Manage Clubs";
    return "";
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftGroup}>
        <Button
          variant="ghost"
          className={styles.hamburgerButton}
          aria-label="Open sidebar"
          onPress={toggle}
        >
          <FaBars />
        </Button>
        <h2 className={styles.pageTitle}>{getPageTitle(pathname || "")}</h2>
      </div>
      <div className={styles.rightSection}>
        <div className={styles.userSection}>
          <div className={styles.userProfile}>
            {userImage && !imgError ? (
              <Image
                src={userImage}
                alt="Profile"
                width={32}
                height={32}
                className={styles.avatar}
                onError={() => setImgError(true)}
              />
            ) : (
              <FaUser className={styles.userIcon} />
            )}
          </div>
          <div className={styles.nameRoleContainer}>
            {userName && <span className={styles.userName}>{userName}</span>}
            {userRole && <span className={styles.userRole}>{roleLabels[userRole]}</span>}
          </div>
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
