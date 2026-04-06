import nodemailer from "nodemailer";
import { Resend } from "resend";

type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

function normalizeRecipients(to: string | string[]) {
  return Array.isArray(to) ? to : [to];
}

function getFromAddress() {
  return process.env.MAIL_FROM || "noreply@corp.dejoiy.com";
}

export async function sendEmail(params: SendEmailParams) {
  const recipients = normalizeRecipients(params.to);

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      from: getFromAddress(),
      to: recipients,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    return result;
  }

  if (!process.env.SMTP_HOST) {
    console.warn(
      "No RESEND_API_KEY or SMTP_HOST configured. Email send skipped."
    );

    return {
      skipped: true,
      reason: "EMAIL_PROVIDER_NOT_CONFIGURED",
    };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });

  const result = await transporter.sendMail({
    from: getFromAddress(),
    to: recipients.join(", "),
    subject: params.subject,
    html: params.html,
    text: params.text,
  });

  return result;
}

type TicketEmailBaseParams = {
  to: string | string[];
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  employeeName: string;
  assignedTo?: string | null;
  ticketUrl?: string;
};

function ticketDetailsHtml(params: TicketEmailBaseParams) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#0f172a;">
      <h2 style="margin-bottom:12px;">Ticket Update</h2>
      <p>Hello ${params.employeeName},</p>
      <p>Your IT service ticket has an update.</p>

      <div style="margin:16px 0;padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
        <p style="margin:0 0 8px;"><strong>Ticket Number:</strong> ${params.ticketNumber}</p>
        <p style="margin:0 0 8px;"><strong>Title:</strong> ${params.title}</p>
        <p style="margin:0 0 8px;"><strong>Status:</strong> ${params.status}</p>
        <p style="margin:0 0 8px;"><strong>Priority:</strong> ${params.priority}</p>
        <p style="margin:0;"><strong>Assigned To:</strong> ${params.assignedTo || "Unassigned"}</p>
      </div>

      ${
        params.ticketUrl
          ? `<p><a href="${params.ticketUrl}" style="color:#4f46e5;font-weight:600;">View Ticket</a></p>`
          : ""
      }

      <p>Regards,<br />DEJOIY Enterprise Service Portal</p>
    </div>
  `;
}

function ticketDetailsText(params: TicketEmailBaseParams) {
  return [
    `Hello ${params.employeeName},`,
    "",
    "Your IT service ticket has an update.",
    "",
    `Ticket Number: ${params.ticketNumber}`,
    `Title: ${params.title}`,
    `Status: ${params.status}`,
    `Priority: ${params.priority}`,
    `Assigned To: ${params.assignedTo || "Unassigned"}`,
    params.ticketUrl ? `View Ticket: ${params.ticketUrl}` : "",
    "",
    "Regards,",
    "DEJOIY Enterprise Service Portal",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function sendTicketCreatedEmail(params: TicketEmailBaseParams) {
  return sendEmail({
    to: params.to,
    subject: `Ticket Created: ${params.ticketNumber}`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#0f172a;">
        <h2 style="margin-bottom:12px;">Ticket Created Successfully</h2>
        <p>Hello ${params.employeeName},</p>
        <p>Your IT service request has been submitted successfully.</p>
        ${ticketDetailsHtml(params)}
      </div>
    `,
    text: `Ticket Created Successfully\n\n${ticketDetailsText(params)}`,
  });
}

export async function sendTicketUpdatedEmail(params: TicketEmailBaseParams) {
  return sendEmail({
    to: params.to,
    subject: `Ticket Updated: ${params.ticketNumber}`,
    html: ticketDetailsHtml(params),
    text: ticketDetailsText(params),
  });
}

export async function sendTicketResolvedEmail(params: TicketEmailBaseParams) {
  return sendEmail({
    to: params.to,
    subject: `Ticket Resolved: ${params.ticketNumber}`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#0f172a;">
        <h2 style="margin-bottom:12px;">Ticket Resolved</h2>
        <p>Hello ${params.employeeName},</p>
        <p>Your ticket has been marked as resolved.</p>
        ${ticketDetailsHtml(params)}
      </div>
    `,
    text: `Ticket Resolved\n\n${ticketDetailsText(params)}`,
  });
}