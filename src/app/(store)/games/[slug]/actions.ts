"use server";

import { createPreorder, cancelPreorder } from "@/data/preorders";
import {
  requestReleaseNotification,
  cancelReleaseNotification,
} from "@/data/notifications";

export type ToggleState = {
  active: boolean;
  error?: string;
  timestamp?: number;
};

export async function togglePreorderAction(
  gameId: string,
  prevState: ToggleState,
  _formData: FormData
): Promise<ToggleState> {
  try {
    if (prevState.active) {
      await cancelPreorder(gameId);
      return { active: false, timestamp: Date.now() };
    }
    await createPreorder(gameId);
    return { active: true, timestamp: Date.now() };
  } catch (err) {
    return {
      active: prevState.active,
      error: err instanceof Error ? err.message : "Something went wrong.",
      timestamp: Date.now(),
    };
  }
}

export async function toggleNotifyMeAction(
  gameId: string,
  prevState: ToggleState,
  _formData: FormData
): Promise<ToggleState> {
  try {
    if (prevState.active) {
      await cancelReleaseNotification(gameId);
      return { active: false, timestamp: Date.now() };
    }
    await requestReleaseNotification(gameId);
    return { active: true, timestamp: Date.now() };
  } catch (err) {
    return {
      active: prevState.active,
      error: err instanceof Error ? err.message : "Something went wrong.",
      timestamp: Date.now(),
    };
  }
}
