import { Assignment } from "@workspace/api-client-react/src/generated/api.schemas";

export function generateICS(assignments: Assignment[], courseName?: string | null): string {
  let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//DueNext AI//EN\nCALSCALE:GREGORIAN\n";
  
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  assignments.forEach((assignment, index) => {
    // Basic validation of date to ensure we don't break the ICS format
    if (!assignment.dueDate) return;
    
    const dtstart = assignment.dueDate.replace(/-/g, "");
    
    // For all-day events, DTEND is exclusive and must be the next day
    const endDtObj = new Date(assignment.dueDate);
    endDtObj.setDate(endDtObj.getDate() + 1);
    const dtend = endDtObj.toISOString().split('T')[0].replace(/-/g, "");
    
    const summary = courseName 
      ? `${courseName}: ${assignment.name}` 
      : assignment.name;
      
    let description = assignment.description || "";
    if (assignment.weight) {
      description = `Weight: ${assignment.weight}\\n\\n${description}`;
    }
    
    ics += "BEGIN:VEVENT\n";
    ics += `UID:duenext-${Date.now()}-${index}@duenext.ai\n`;
    ics += `DTSTAMP:${now}\n`;
    ics += `DTSTART;VALUE=DATE:${dtstart}\n`;
    ics += `DTEND;VALUE=DATE:${dtend}\n`;
    ics += `SUMMARY:${escapeICSString(summary)}\n`;
    if (description) {
      ics += `DESCRIPTION:${escapeICSString(description)}\n`;
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
