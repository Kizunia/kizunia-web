import { StarIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import type { ProjectPublicDetailsDto } from "@/modules/projects/backend/dto/output";

interface ProjectTestimonialsProps {
  testimonials: ProjectPublicDetailsDto["testimonials"];
}

export function ProjectTestimonials({ testimonials }: ProjectTestimonialsProps) {
  if (testimonials.length === 0) {
    return null;
  }

  const sorted = [...testimonials].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {sorted.map((testimonial) => (
        <Card key={testimonial.id} className="space-y-3 p-5">
          {testimonial.rating !== null && (
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }, (_, index) => (
                <StarIcon
                  key={index}
                  className={
                    index < testimonial.rating!
                      ? "size-4 fill-amber-400 text-amber-400"
                      : "size-4 text-muted-foreground/30"
                  }
                />
              ))}
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            &ldquo;{testimonial.message}&rdquo;
          </p>

          <div className="flex items-center gap-3 pt-1">
            <Avatar className="size-8">
              <AvatarImage src={testimonial.image?.url} alt={testimonial.name} />
              <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{testimonial.name}</p>

              {(testimonial.position || testimonial.company) && (
                <p className="truncate text-xs text-muted-foreground">
                  {[testimonial.position, testimonial.company]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
