"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Popover } from "@base-ui/react/popover";
import { Button } from "@/components/ui/button";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "./notificationActions";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationBell({
  initialNotifications,
  initialUnreadCount,
}: {
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [, startTransition] = useTransition();

  function markOneRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((count) => Math.max(0, count - 1));
    startTransition(async () => {
      await markNotificationReadAction(id);
    });
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    startTransition(async () => {
      await markAllNotificationsReadAction();
    });
  }

  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          <Button variant="outline" size="icon" aria-label="Notifications">
            <span className="relative inline-flex">
              🔔
              {unreadCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </span>
          </Button>
        }
      />
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="end">
          <Popover.Popup className="w-80 rounded-xl border bg-card p-3 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No notifications yet.
              </p>
            ) : (
              <div className="flex max-h-96 flex-col gap-1 overflow-y-auto">
                {notifications.map((notification) => {
                  const body = (
                    <>
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {notification.body}
                      </p>
                    </>
                  );
                  const className = `block rounded-lg p-2 text-left text-sm ${
                    notification.read ? "" : "bg-muted"
                  }`;

                  return notification.link ? (
                    <Popover.Close
                      key={notification.id}
                      nativeButton={false}
                      onClick={() => markOneRead(notification.id)}
                      render={
                        <Link href={notification.link} className={className}>
                          {body}
                        </Link>
                      }
                    />
                  ) : (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => markOneRead(notification.id)}
                      className={className}
                    >
                      {body}
                    </button>
                  );
                })}
              </div>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
