import { useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { Pencil, Check, X, Trash2, AlertTriangle, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditableAssignment, ASSIGNMENT_TYPES, AssignmentType } from "@/lib/store";
import { buildGoogleCalendarUrl } from "@/lib/ics";

interface AssignmentCardProps {
  assignment: EditableAssignment;
  startEditing?: boolean;
  onUpdate?: (updated: EditableAssignment) => void;
  onDelete?: () => void;
}

export function AssignmentCard({ assignment, startEditing, onUpdate, onDelete }: AssignmentCardProps) {
  const [editing, setEditing] = useState(startEditing ?? false);
  const [draft, setDraft] = useState({ ...assignment });

  let formattedDate = assignment.dueDate;
  try {
    const parsedDate = parseISO(assignment.dueDate);
    if (isValid(parsedDate)) {
      formattedDate = format(parsedDate, "MMM d, yyyy");
    }
  } catch {
    // fallback
  }

  const startEdit = () => {
    setDraft({ ...assignment });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const saveEdit = () => {
    onUpdate?.(draft);
    setEditing(false);
  };

  const isActivity = draft.type === "class-activity";

  if (editing) {
    return (
      <div className="flex flex-col gap-3 p-5">
        <div className="w-full sm:w-64">
          <label className="text-[11px] text-muted-foreground/70 mb-1 block uppercase tracking-wider font-medium">Course</label>
          <Input
            value={draft.courseName ?? ""}
            onChange={(e) => setDraft({ ...draft, courseName: e.target.value || null })}
            placeholder="e.g. CS 101"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-[11px] text-muted-foreground/70 mb-1 block uppercase tracking-wider font-medium">Name</label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div className="w-full sm:w-40">
            <label className="text-[11px] text-muted-foreground/70 mb-1 block uppercase tracking-wider font-medium">Weight</label>
            <Input
              value={draft.weight ?? ""}
              onChange={(e) => setDraft({ ...draft, weight: e.target.value || null })}
              placeholder="e.g. 10%"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-44">
            <label className="text-[11px] text-muted-foreground/70 mb-1 block uppercase tracking-wider font-medium">Due Date</label>
            <Input
              type="date"
              value={draft.dueDate}
              onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
            />
          </div>
          <div className="w-full sm:w-36">
            <label className="text-[11px] text-muted-foreground/70 mb-1 block uppercase tracking-wider font-medium">Due Time</label>
            <Input
              type="time"
              value={draft.dueTime ?? ""}
              onChange={(e) => setDraft({ ...draft, dueTime: e.target.value || null })}
            />
          </div>
          <div className="flex-1">
            <label className="text-[11px] text-muted-foreground/70 mb-1 block uppercase tracking-wider font-medium">Type</label>
            <select
              value={draft.type ?? "assignment"}
              onChange={(e) => setDraft({ ...draft, type: e.target.value as AssignmentType })}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {ASSIGNMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {isActivity && (
          <div className="w-full sm:w-36">
            <label className="text-[11px] text-muted-foreground/70 mb-1 block uppercase tracking-wider font-medium">Activity Time</label>
            <Input
              type="time"
              value={draft.activityTime ?? ""}
              onChange={(e) => setDraft({ ...draft, activityTime: e.target.value || null })}
            />
          </div>
        )}

        <div className="flex-1">
          <label className="text-[11px] text-muted-foreground/70 mb-1 block uppercase tracking-wider font-medium">Description</label>
          <Input
            value={draft.description ?? ""}
            onChange={(e) => setDraft({ ...draft, description: e.target.value || null })}
            placeholder="Optional details"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" onClick={saveEdit}>
            <Check className="w-3.5 h-3.5 mr-1.5" />
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={cancelEdit}>
            <X className="w-3.5 h-3.5 mr-1.5" />
            Cancel
          </Button>
          {onDelete && (
            <Button size="sm" variant="ghost" onClick={onDelete} className="ml-auto text-destructive hover:text-destructive">
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete
            </Button>
          )}
        </div>
      </div>
    );
  }

  const assignmentType = assignment.type ?? "assignment";
  const typeInfo = ASSIGNMENT_TYPES.find((t) => t.value === assignmentType);
  const typeLabel = typeInfo?.label ?? "Assignment";
  const googleCalendarUrl = buildGoogleCalendarUrl(assignment);

  return (
    <div className={`flex flex-col p-5 group glass-card rounded-lg ${assignment.needsReview ? "bg-amber-500/5 ring-1 ring-inset ring-amber-500/30" : ""}`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 flex gap-3">
          <div>
            {assignment.courseName && (
              <p className="text-xs text-muted-foreground/70 font-medium uppercase tracking-wider mb-0.5">
                {assignment.courseName}
              </p>
            )}
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h3 className="text-base font-medium text-foreground">
                {assignment.name}
              </h3>
              {assignmentType !== "assignment" && (
                <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  {typeLabel}
                </span>
              )}
              {assignment.weight && (
                <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {assignment.weight}
                </span>
              )}
              {assignment.needsReview && (
                <span
                  className="text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded flex items-center gap-1"
                  title={assignment.dateHint ? `Estimated from: "${assignment.dateHint}"` : "This date is an estimate"}
                >
                  <AlertTriangle className="w-3 h-3" />
                  Unconfirmed date{assignment.dateHint ? ` (${assignment.dateHint})` : ""}
                </span>
              )}
            </div>

            {assignment.description && (
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-3xl">
                {assignment.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="sm:text-right">
            <span className="text-sm font-medium text-foreground">
              {formattedDate}
            </span>
            {assignment.dueTime && (
              <span className="text-sm text-muted-foreground ml-2">
                {assignment.dueTime}
              </span>
            )}
            {assignment.type === "class-activity" && assignment.activityTime && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Activity at {assignment.activityTime}
              </p>
            )}
          </div>
          {assignment.needsReview && onUpdate && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2.5 border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
              onClick={() => onUpdate({ ...assignment, needsReview: false })}
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Looks right
            </Button>
          )}
          {googleCalendarUrl && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
              title="Add to Google Calendar"
              asChild
            >
              <a href={googleCalendarUrl} target="_blank" rel="noopener noreferrer">
                <CalendarPlus className="w-3.5 h-3.5" />
              </a>
            </Button>
          )}
          {onUpdate && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
              onClick={startEdit}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
