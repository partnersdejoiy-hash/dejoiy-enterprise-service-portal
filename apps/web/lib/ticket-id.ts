import { prisma } from "@/lib/db";

export async function generateTicketNumber() {
  const counter = await prisma.$transaction(async (tx) => {
    const current = await tx.ticketCounter.upsert({
      where: { id: "ticket_counter" },
      create: {
        id: "ticket_counter",
        value: 1,
      },
      update: {
        value: {
          increment: 1,
        },
      },
    });

    return current.value;
  });

  return `DEJ-IT-${String(counter).padStart(4, "0")}`;
}