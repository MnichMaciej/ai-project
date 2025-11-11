import { useEffect, useRef } from "react";

interface InfiniteScrollTriggerProps {
  onLoadMore: () => void;
  hasMore: boolean;
  loadingMore: boolean;
}

/**
 * InfiniteScrollTrigger - Component that detects when user scrolls to the bottom
 * Uses IntersectionObserver API to trigger loading more items
 * Should be placed at the end of a scrollable list
 */
export function InfiniteScrollTrigger({ onLoadMore, hasMore, loadingMore }: InfiniteScrollTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger || !hasMore || loadingMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && hasMore && !loadingMore) {
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin: "100px", // Trigger 100px before reaching the bottom
        threshold: 0.1,
      }
    );

    observer.observe(trigger);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadingMore, onLoadMore]);

  // Don't render if there's no more content to load
  if (!hasMore) {
    return null;
  }

  return (
    <div
      ref={triggerRef}
      className="h-4 w-full"
      aria-label="Trigger do ładowania kolejnych projektów"
      aria-hidden="true"
    />
  );
}
