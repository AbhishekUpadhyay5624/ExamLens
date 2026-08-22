import { useEffect, useState } from "react";
import { api } from "./api";

// Fetches a binary resource (heatmap PNG, clip MP4) that requires the
// Authorization header, and exposes it as an object URL usable by <img>/<video>.
//
// A plain `<img src="/api/.../heatmap">` can't send the bearer token, so we
// pull the bytes through the authed axios client (responseType: "blob") and
// wrap them in URL.createObjectURL. The URL is revoked on unmount / url change.
//
// Returns { objectUrl, loading, error }.
export function useAuthedBlob(url) {
  const [objectUrl, setObjectUrl] = useState(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) {
      setObjectUrl(null);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;
    let createdUrl = null;
    setLoading(true);
    setError(null);

    api
      .get(url, { responseType: "blob" })
      .then((res) => {
        if (!active) return;
        createdUrl = URL.createObjectURL(res.data);
        setObjectUrl(createdUrl);
      })
      .catch((err) => {
        if (!active) return;
        setError(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [url]);

  return { objectUrl, loading, error };
}
