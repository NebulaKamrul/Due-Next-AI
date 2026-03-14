import { EditableAssignment, CALENDAR_COLORS } from "@/lib/store";

export function generateICS(assignments: EditableAssignment[], courseName?: string | null): string {
  let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//DueNext AI//EN\nCALSCALE:GREGORIAN\n";
  
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  assignments.forEach((assignment, index) => {
    if (!assignment.dueDate) return;
    
    const summary = courseName 
      ? `${courseName}: ${assignment.name}` 
      : assignment.name;
      
    let description = assignment.description || "";
    if (assignment.weight) {
      description = `Weight: ${assignment.weight}\\n\\n${description}`;
    }
    if (assignment.type === "class-activity" && assignment.activityTime) {
      description = `Activity at ${assignment.activityTime}\\n${description}`;
    }

    const timeToUse = assignment.type === "class-activity"
      ? (assignment.activityTime || assignment.dueTime)
      : assignment.dueTime;

    ics += "BEGIN:VEVENT\n";
    ics += `UID:duenext-${Date.now()}-${index}@duenext.ai\n`;
    ics += `DTSTAMP:${now}\n`;

    if (timeToUse) {
      const dtstart = assignment.dueDate.replace(/-/g, "") + "T" + timeToUse.replace(/:/g, "") + "00";
      const [h, m] = timeToUse.split(":").map(Number);
      const endMinutes = h * 60 + m + 60;
      const endH = String(Math.floor(endMinutes / 60) % 24).padStart(2, "0");
      const endM = String(endMinutes % 60).padStart(2, "0");
      const dtend = assignment.dueDate.replace(/-/g, "") + "T" + endH + endM + "00";
      ics += `DTSTART:${dtstart}\n`;
      ics += `DTEND:${dtend}\n`;
    } else {
      const dtstart = assignment.dueDate.replace(/-/g, "");
      const endDtObj = new Date(assignment.dueDate);
      endDtObj.setDate(endDtObj.getDate() + 1);
      const dtend = endDtObj.toISOString().split('T')[0].replace(/-/g, "");
      ics += `DTSTART;VALUE=DATE:${dtstart}\n`;
      ics += `DTEND;VALUE=DATE:${dtend}\n`;
    }

    ics += `SUMMARY:${escapeICSString(summary)}\n`;
    if (description) {
      ics += `DESCRIPTION:${escapeICSString(description)}\n`;
    }
    if (assignment.color) {
      const colorEntry = CALENDAR_COLORS.find(c => c.hex === assignment.color);
      if (colorEntry) {
        ics += `CATEGORIES:${colorEntry.name}\n`;
        ics += `X-APPLE-CALENDAR-COLOR:${colorEntry.hex}\n`;
      }
    }
    ics += "END:VEVENT\n";
  });
  
  ics += "END:VCALENDAR";
  return ics;
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
