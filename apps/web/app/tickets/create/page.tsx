import { AppShell } from "@/components/app-shell";
import { TicketForm } from "@/components/ticket-form";

export default function CreateTicketPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Create IT Support Ticket
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Submit incidents, service requests, access issues, hardware problems,
          software issues, and network-related support tickets.
        </p>
      </div>

      <TicketForm />
    </AppShell>
  );
}
