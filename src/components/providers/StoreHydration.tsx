"use client";

import { useEffect } from "react";
import { useGameStore } from "@/store/game-store";

/** Ensures zustand persist finishes before UI relies on localStorage. */
export function StoreHydration() {
  useEffect(() => {
    // rehydrate if needed
    void useGameStore.persist.rehydrate();
    useGameStore.getState().setHasHydrated(true);
  }, []);
  return null;
}
