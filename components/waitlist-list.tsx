"use client";

import { useRef, useEffect } from "react";
import useSWRInfinite from "swr/infinite";
import { formatDistanceToNowStrict } from "date-fns";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PAGE_SIZE = 20;

export default function WaitlistList() {
  const getKey = (pageIndex: number, previous: any) => {
    if (previous && previous.data.length < PAGE_SIZE) return null; // reached end
    return `/api/waitlist?offset=${pageIndex * PAGE_SIZE}&limit=${PAGE_SIZE}`;
  };

  const { data, error, size, setSize, isValidating } = useSWRInfinite<any>(
    getKey,
    (url: string) => fetch(url).then((r) => r.json()),
  );

  const items = data ? data.flatMap((d: any) => d.data) : [];
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setSize(size + 1);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [size, setSize]);

  if (error) return null;

  return (
    <section className="max-w-3xl mx-auto w-full px-4 mt-4">
      <h2 className="text-2xl font-bold text-center">Waitlist</h2>
      <p className="text-muted-foreground mb-4 text-sm text-center">Stay updated for the launch and be the first to access.</p>
      {items.length === 0 ? (
        <p className="text-muted-foreground">Be the first to join the wait-list!</p>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-muted-foreground border-b">
                <th className="py-2 text-left font-normal">#</th>
                <th className="py-2 text-left font-normal">Name</th>
                <th className="py-2 text-left font-normal">Reason</th>
                <th className="py-2 text-left font-normal">Joined</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row: any, idx: number) => (
                <tr key={row.id} className="border-b last:border-none">
                  <td className="py-2 pr-4 w-8">{idx + 1}</td>
                  <td className="py-2 pr-4">{row.name}</td>
                  <td className="py-2 pr-4 max-w-[200px]">
                    {row.note ? (
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="line-clamp-3 cursor-pointer">
                              {row.note}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            {row.note}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2">{formatDistanceToNowStrict(new Date(row.created_at), { addSuffix: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {isValidating && <Spinner className="mx-auto mt-4" />}
      <div ref={sentinelRef} className="h-4" />
    </section>
  );
} 