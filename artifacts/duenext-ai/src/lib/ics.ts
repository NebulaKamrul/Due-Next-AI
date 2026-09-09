import { EditableAssignment } from "@/lib/store";

interface EventFields {
  summary: string;
  description: string;
  dateStart: string;
  dateEnd: string;
  allDay: boolean;
}

function computeEventFields(assignment: EditableAssignment): EventFields | null {
  if (!assignment.dueDate) return null;

  const summary = assignment.courseName
    ? `${assignment.courseName}: ${assignment.name}`
    : assignment.name;

  let description = assignment.description || "";
  if (assignment.weight) {
    description = `Weight: ${assignment.weight}\n\n${description}`;
  }
  if (assignment.type === "class-activity" && assignment.activityTime) {
    description = `Activity at ${assignment.activityTime}\n${description}`;
  }

  const timeToUse = assignment.type === "class-activity"
    ? (assignment.activityTime || assignment.dueTime)
    : assignment.dueTime;

  if (timeToUse) {
    const dateStart = assignment.dueDate.replace(/-/g, "") + "T" + timeToUse.replace(/:/g, "") + "00";
    const [h, m] = timeToUse.split(":").map(Number);
    const endMinutes = h * 60 + m + 60;
    const endH = String(Math.floor(endMinutes / 60) % 24).padStart(2, "0");
    const endM = String(endMinutes % 60).padStart(2, "0");
    const dateEnd = assignment.dueDate.replace(/-/g, "") + "T" + endH + endM + "00";
    return { summary, description, dateStart, dateEnd, allDay: false };
  }

  const dateStart = assignment.dueDate.replace(/-/g, "");
  const endDtObj = new Date(assignment.dueDate);
  endDtObj.setDate(endDtObj.getDate() + 1);
  const dateEnd = endDtObj.toISOString().split("T")[0].replace(/-/g, "");
  return { summary, description, dateStart, dateEnd, allDay: true };
}

export function generateICS(assignments: EditableAssignment[]): string {
  let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//DueNext AI//EN\nCALSCALE:GREGORIAN\n";

  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  assignments.forEach((assignment, index) => {
    const fields = computeEventFields(assignment);
    if (!fields) return;
    const { summary, description, dateStart, dateEnd, allDay } = fields;

    ics += "BEGIN:VEVENT\n";
    ics += `UID:duenext-${Date.now()}-${index}@duenext.ai\n`;
    ics += `DTSTAMP:${now}\n`;

    if (allDay) {
      ics += `DTSTART;VALUE=DATE:${dateStart}\n`;
      ics += `DTEND;VALUE=DATE:${dateEnd}\n`;
    } else {
      ics += `DTSTART:${dateStart}\n`;
      ics += `DTEND:${dateEnd}\n`;
    }

    ics += `SUMMARY:${escapeICSString(summary)}\n`;
    if (description) {
      ics += `DESCRIPTION:${escapeICSString(description)}\n`;
    }
    ics += "BEGIN:VALARM\n";
    ics += "ACTION:DISPLAY\n";
    ics += `DESCRIPTION:${escapeICSString(summary)}\n`;
    ics += `TRIGGER:${allDay ? "-P1D" : "-PT30M"}\n`;
    ics += "END:VALARM\n";
    ics += "END:VEVENT\n";
  });

  ics += "END:VCALENDAR";
  return ics;
}

/**
 * Builds a Google Calendar "quick add" link that pre-fills a single event -
 * opens in Google Calendar's own UI for the user to review and save. This is
 * a plain URL, no OAuth or API access needed, so it works for anyone without
 * any setup. It's one event at a time, and Google Calendar decides the color
 * (same limitation as .ics import - see the "Color tag" note on each card).
 */
export function buildGoogleCalendarUrl(assignment: EditableAssignment): string | null {
  const fields = computeEventFields(assignment);
  if (!fields) return null;
  const { summary, description, dateStart, dateEnd } = fields;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: summary,
    dates: `${dateStart}/${dateEnd}`,
  });
  if (description) params.set("details", description);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeICSString(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function downloadICS(icsString: string, filename: string = "syllabus-assignments.ics") {
  const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
