import { QueryClient } from "@tanstack/react-query";

// Single shared client. Defaults tuned for a polling dashboard:
// - retry once (the API is local; a transient blip shouldn't spin)
// - don't refetch on window focus (status polling handles freshness)
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000,
    },
  },
});
