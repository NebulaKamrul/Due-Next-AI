import { format, parseISO, isValid } from "date-fns";
import { CalendarDays, Scale, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Assignment } from "@workspace/api-client-react/src/generated/api.schemas";

interface AssignmentCardProps {
  assignment: Assignment;
}

export function AssignmentCard({ assignment }: AssignmentCardProps) {
  // Format date nicely (e.g., "March 14, 2026")
  let formattedDate = assignment.dueDate;
  try {
    const parsedDate = parseISO(assignment.dueDate);
    if (isValid(parsedDate)) {
      formattedDate = format(parsedDate, "MMMM d, yyyy");
    }
  } catch (e) {
    // fallback to raw date if parsing fails
  }

  return (
    <Card className="flex flex-col p-5 bg-card border-border/50 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        
        {/* Main Content */}
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold text-foreground leading-tight">
              {assignment.name}
            </h3>
            {/* Show badge strictly on small mobile screens beside title */}
            {assignment.weight && (
              <Badge variant="secondary" className="sm:hidden shrink-0 flex items-center gap-1 text-xs">
                <Scale className="w-3 h-3" />
                {assignment.weight}
              </Badge>
            )}
          </div>
          
          {assignment.description && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground mt-1">
              <FileText className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground/70" />
              <p className="leading-relaxed line-clamp-2" title={assignment.description}>
                {assignment.description}
              </p>
            </div>
          )}
        </div>

        {/* Right Sidebar (Date & Weight) */}
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:min-w-[140px] shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
          <div className="flex items-center gap-2 text-primary font-medium">
            <CalendarDays className="w-4 h-4" />
            <span className="text-sm">{formattedDate}</span>
          </div>
          
          {/* Show badge on larger screens aligned right */}
          {assignment.weight && (
            <Badge variant="secondary" className="hidden sm:flex items-center gap-1 text-xs">
              <Scale className="w-3 h-3" />
              {assignment.weight}
            </Badge>
          )}
        </div>
        
      </div>
    </Card>
  );
}
