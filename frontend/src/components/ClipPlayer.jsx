import { Film } from "lucide-react";
import { useAuthedBlob } from "../lib/useAuthedBlob";
import Skeleton from "./Skeleton";

// Plays an event's evidence clip. The endpoint needs auth, so we load the clip
// as a blob URL; the browser can seek freely within the fully-loaded blob.
export default function ClipPlayer({ eventId, hasClip }) {
  const { objectUrl, loading, error } = useAuthedBlob(
    hasClip ? `/events/${eventId}/clip` : null
  );

  if (!hasClip) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-400">
        <Film size={16} className="mr-2" />
        No evidence clip for this event.
      </div>
    );
  }

  if (loading) {
    return <Skeleton className="aspect-video w-full rounded-xl" />;
  }

  if (error) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-400">
        Clip unavailable.
      </div>
    );
  }

  return (
    <video
      src={objectUrl}
      controls
      className="aspect-video w-full rounded-xl"
    />
  );
}
