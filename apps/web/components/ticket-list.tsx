import Link from "next/link";

type TicketItem = {
  id: string;
  ticketNumber: string;
  title: string;
  priority: string;
  status: string;
  employee: string;
  department: string;
  assignedTo?: string | null;
};

export function TicketList({ tickets }: { tickets: TicketItem[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/40 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Ticket #</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-4">
                  <Link
                    href={`/tickets/${ticket.id}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {ticket.ticketNumber}
                  </Link>
                </td>
                <td className="px-4 py-4">{ticket.title}</td>
                <td className="px-4 py-4">{ticket.priority}</td>
                <td className="px-4 py-4">{ticket.status}</td>
                <td className="px-4 py-4">{ticket.employee}</td>
                <td className="px-4 py-4">{ticket.department}</td>
                <td className="px-4 py-4">{ticket.assignedTo ?? "Unassigned"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
