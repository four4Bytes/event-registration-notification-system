"use client";

import clsx from "clsx";
import { Focusable } from "react-aria-components";

import { Tooltip, TooltipTrigger } from "@/components/ui/Tooltip/Tooltip";

import styles from "./ClubLabel.module.css";

interface ClubLabelProps {
  name: string;
  shortName?: string | null;
  className?: string;
}

export function ClubLabel({ name, shortName, className }: ClubLabelProps) {
  if (!shortName) {
    return <span className={className}>{name}</span>;
  }

  return (
    <TooltipTrigger>
      <Focusable>
        <abbr className={clsx(styles.abbr, className)}>{shortName}</abbr>
      </Focusable>
      <Tooltip>{name}</Tooltip>
    </TooltipTrigger>
  );
}
