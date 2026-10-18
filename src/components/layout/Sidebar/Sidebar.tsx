"use client";

import clsx from "clsx";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { FaBars, FaBell, FaCalendarDays, FaUser, FaUsers, FaX } from "react-icons/fa6";

import { Button } from "@/components/ui/Button/Button";
import { useNavigationProgress } from "@/components/ui/TopProgressBar/navigation-context";
import { roleLabels } from "@/features/users/constants";
import { Role } from "@/generated/prisma/browser";
import { can, type Permission } from "@/lib/security/rbac";

import { toggleSidebarAction } from "./actions";
import { useSidebar } from "./sidebar-context";
import styles from "./Sidebar.module.css";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType;
  permission?: Permission;
}

const navItems: NavItem[] = [
  { label: "Events", href: "/events", icon: FaCalendarDays },
  { label: "Notifications", href: "/notifications", icon: FaBell },
  { label: "Manage Users", href: "/admin/users", icon: FaUsers, permission: "manageUsers" },
];

interface SidebarProps {
  initialCollapsed?: boolean;
  userName?: string | null;
  userRole?: Role | null;
  userImage?: string | null;
}

export function Sidebar({ initialCollapsed = false, userName, userRole, userImage }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [imgError, setImgError] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { startLoading } = useNavigationProgress();
  const { isOpen, close } = useSidebar();

  const handleToggle = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    toggleSidebarAction(nextState);
  };

  const handleNavClick = (href: string) => {
    close();
    if (!pathname.startsWith(href)) {
      startLoading();
      router.push(href);
    }
  };

  return (
    <>
      <aside className={clsx(styles.sidebar, collapsed && styles.collapsed)} data-open={isOpen}>
        <div className={styles.topRow}>
          <Button
            variant="ghost"
            aria-label="Go to notifications"
            onPress={() => handleNavClick("/notifications")}
          >
            <Image
              src="/school-logo.svg"
              alt="School logo"
              width={48}
              height={48}
              className={styles.logo}
            />
          </Button>
          <Button
            variant="ghost"
            className={styles.closeButton}
            aria-label="Close sidebar"
            onPress={close}
          >
            <FaX />
          </Button>
          <Button
            variant="ghost"
            className={styles.toggleButton}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onPress={handleToggle}
          >
            <FaBars />
          </Button>
        </div>
        <div className={styles.textContainer}>
          <h1 className={styles.title}>Event Registration &amp;</h1>
          <h1 className={styles.desc}>Notification System</h1>
        </div>
        <nav className={styles.navContainer}>
          {navItems
            .filter((item) => !item.permission || (userRole && can(userRole, item.permission)))
            .map((item) => (
              <Button
                key={item.href}
                variant="navigation"
                className={styles.navButton}
                onPress={() => handleNavClick(item.href)}
                data-active={pathname.startsWith(item.href)}
                title={collapsed ? item.label : undefined}
              >
                <span>
                  <item.icon />
                </span>
                <span className={styles.navLabel}>{item.label}</span>
              </Button>
            ))}
        </nav>
        <div className={styles.profileSection}>
          <div className={styles.profileAvatar}>
            {userImage && !imgError ? (
              <Image
                src={userImage}
                alt="Profile"
                width={40}
                height={40}
                className={styles.profileAvatarImage}
                onError={() => setImgError(true)}
              />
            ) : (
              <FaUser className={styles.profileAvatarIcon} />
            )}
          </div>
          <div className={styles.profileNameRole}>
            {userName && <span className={styles.profileName}>{userName}</span>}
            {userRole && <span className={styles.profileRole}>{roleLabels[userRole]}</span>}
          </div>
        </div>
      </aside>
      <div className={styles.backdrop} data-open={isOpen} onClick={close} />
    </>
  );
}
