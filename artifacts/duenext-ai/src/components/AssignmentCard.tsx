import { useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditableAssignment, CALENDAR_COLORS, ASSIGNMENT_TYPES, AssignmentType } from "@/lib/store";

interface AssignmentCardProps {
  assignment: EditableAssignment;
  onUpdate?: (updated: EditableAssignment) => void;
  onApplyColorToAll?: (color: string | null) => void;
  onApplyColorToType?: (color: string | null, type: string) => void;
}

export function AssignmentCard({ assignment, onUpdate, onApplyColorToAll, onApplyColorToType }: AssignmentCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...assignment });
  const [showColorApply, setShowColorApply] = useState(false);

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
    const colorChanged = draft.color !== assignment.color && draft.color !== null;
    onUpdate?.(draft);
    setEditing(false);
    if (colorChanged) {
      setShowColorApply(true);
    }
  };

  const isActivity = draft.type === "class-activity";
  const colorHex = assignment.color || null;

  if (editing) {
    return (
      <div className="flex flex-col gap-3 p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Name</label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div className="w-full sm:w-40">
            <label className="text-xs text-muted-foreground mb-1 block">Weight</label>
            <Input
              value={draft.weight ?? ""}
              onChange={(e) => setDraft({ ...draft, weight: e.target.value || null })}
              placeholder="e.g. 10%"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-44">
            <label className="text-xs text-muted-foreground mb-1 block">Due date</label>
            <Input
              type="date"
              value={draft.dueDate}
              onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
            />
          </div>
          <div className="w-full sm:w-36">
            <label className="text-xs text-muted-foreground mb-1 block">Due time</label>
            <Input
              type="time"
              value={draft.dueTime ?? ""}
              onChange={(e) => setDraft({ ...draft, dueTime: e.target.value || null })}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Type</label>
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
            <label className="text-xs text-muted-foreground mb-1 block">Activity time</label>
            <Input
              type="time"
              value={draft.activityTime ?? ""}
              onChange={(e) => setDraft({ ...draft, activityTime: e.target.value || null })}
            />
          </div>
        )}

        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Description</label>
          <Input
            value={draft.description ?? ""}
            onChange={(e) => setDraft({ ...draft, description: e.target.value || null })}
            placeholder="Optional details"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Calendar color</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDraft({ ...draft, color: null })}
              className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                !draft.color
                  ? "border-foreground scale-110"
                  : "border-border hover:border-muted-foreground"
              }`}
              title="Default"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
            {CALENDAR_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setDraft({ ...draft, color: c.hex })}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  draft.color === c.hex
                    ? "border-foreground scale-110"
                    : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
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
        </div>
      </div>
    );
  }

  const assignmentType = assignment.type ?? "assignment";
  const typeInfo = ASSIGNMENT_TYPES.find((t) => t.value === assignmentType);
  const typeLabel = typeInfo?.label ?? "Assignment";
  const typeLabelPlural = assignmentType === "class-activity" ? "class activities"
    : assignmentType === "quiz" ? "quizzes"
    : assignmentType === "practical" ? "practicals"
    : assignmentType === "other" ? "others"
    : `${typeLabel.toLowerCase()}s`;

  return (
    <div className="flex flex-col p-5 group glass-card rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 flex gap-3">
          {colorHex && (
            <div
              className="w-1 rounded-full shrink-0 mt-1"
              style={{ backgroundColor: colorHex, minHeight: "1.25rem" }}
            />
          )}
          <div>
            <div className="flex items-center gap-3 mb-1">
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
        </div>
      </div>

      {showColorApply && colorHex && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border/50">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colorHex }} />
          <span className="text-xs text-muted-foreground mr-1">Apply this color to:</span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2.5"
            onClick={() => {
              onApplyColorToAll?.(assignment.color ?? null);
              setShowColorApply(false);
            }}
          >
            All assignments
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2.5"
            onClick={() => {
              onApplyColorToType?.(assignment.color ?? null, assignmentType);
              setShowColorApply(false);
            }}
          >
            All {typeLabelPlural}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs px-2 text-muted-foreground"
            onClick={() => setShowColorApply(false)}
          >
            Just this one
          </Button>
        </div>
      )}
    </div>
  );
}
