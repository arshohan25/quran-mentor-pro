import { useNotificationScheduler } from "@/hooks/useNotificationScheduler";

// Mounts the global notification scheduler effect.
// Kept as a separate component so the hook lives inside Router/Provider context.
export default function NotificationSchedulerHost() {
  useNotificationScheduler();
  return null;
}
