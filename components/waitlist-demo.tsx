import { formatDistanceToNowStrict } from "date-fns";

// A static placeholder list shown on the landing page before Supabase is configured.
export default function WaitlistDemo() {
  const rows = [
    { id: 1, name: "Jane", note: "Love the concept!", created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) },
    { id: 2, name: "Arun", note: "Can't wait", created_at: new Date(Date.now() - 1000 * 60 * 60 * 24) },
    { id: 3, name: "Sara", note: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 3) },
  ];

  return (
    <section className="max-w-3xl mx-auto w-full px-4 mt-8">
      <h2 className="text-2xl font-bold">Join the waitlist</h2>
      <p className="text-muted-foreground mb-4 text-sm">Stay updated for the launch and be the first to access.</p>
      <div className="w-full overflow-x-auto border rounded-md">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase text-muted-foreground border-b">
              <th className="py-2 text-left font-normal w-8">#</th>
              <th className="py-2 text-left font-normal">Name</th>
              <th className="py-2 text-left font-normal">Reason</th>
              <th className="py-2 text-left font-normal">Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className="border-b last:border-none">
                <td className="py-2 pr-4 w-8">{idx + 1}</td>
                <td className="py-2 pr-4">{row.name}</td>
                <td className="py-2 pr-4 max-w-[200px] truncate">{row.note ?? "—"}</td>
                <td className="py-2">
                  {formatDistanceToNowStrict(row.created_at, { addSuffix: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
} 