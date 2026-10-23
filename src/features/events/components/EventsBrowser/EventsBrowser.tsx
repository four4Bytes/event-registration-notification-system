"use client";

import { useState } from "react";

import { SearchField } from "@/components/ui/SearchField/SearchField";
import { Select, SelectItem } from "@/components/ui/Select/Select";

import { filterEvents, useEvents } from "../../event-data";
import type { EventFilter } from "../../types";
import { EventCard } from "../EventCard/EventCard";
import styles from "./EventsBrowser.module.css";

export function EventsBrowser() {
  const events = useEvents();
  const [search, setSearch] = useState("");
  const [host, setHost] = useState<EventFilter["host"]>("all");
  const [time, setTime] = useState<EventFilter["time"]>("upcoming");

  const filteredEvents = filterEvents(events, { search, host, time });

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <SearchField
          aria-label="Search events"
          placeholder="Search events by title or club"
          value={search}
          onChange={setSearch}
          className={styles.searchField}
        />
        <Select
          aria-label="Filter by event host"
          value={host}
          onChange={(key) => {
            if (key === "all" || key === "organization" || key === "club") setHost(key);
          }}
          className={styles.select}
        >
          <SelectItem id="all">All events</SelectItem>
          <SelectItem id="organization">Organization-wide</SelectItem>
          <SelectItem id="club">Club events</SelectItem>
        </Select>
        <Select
          aria-label="Filter by date"
          value={time}
          onChange={(key) => {
            if (key === "upcoming" || key === "all") setTime(key);
          }}
          className={styles.select}
        >
          <SelectItem id="upcoming">Upcoming</SelectItem>
          <SelectItem id="all">All dates</SelectItem>
        </Select>
        <p className={styles.resultCount} aria-live="polite">
          Showing {filteredEvents.length} of {events.length} events
        </p>
      </div>

      {filteredEvents.length > 0 ? (
        <div className={styles.grid}>
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className={styles.empty} role="status">
          <p className={styles.emptyTitle}>No events match your filters</p>
          <p className={styles.emptyText}>Try a different search or switch to all dates.</p>
        </div>
      )}
    </div>
  );
}
