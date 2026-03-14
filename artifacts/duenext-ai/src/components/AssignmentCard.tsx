import { format, parseISO, isValid } from "date-fns";
import { Assignment } from "@workspace/api-client-react/src/generated/api.schemas";

interface AssignmentCardProps {
  assignment: Assignment;
}

export function AssignmentCard({ assignment }: AssignmentCardProps) {
  let formattedDate = assignment.dueDate;
  try {
    const parsedDate = parseISO(assignment.dueDate);
    if (isValid(parsedDate)) {
      formattedDate = format(parsedDate, "MMM d, yyyy");
    }
  } catch (e) {
    // fallback
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-5">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-base font-medium text-foreground">
            {assignment.name}
          </h3>
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

      <div className="sm:text-right shrink-0">
        <span className="text-sm font-medium text-foreground">
          {formattedDate}
        </span>
      </div>
    </div>
  );
}
