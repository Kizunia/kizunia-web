import Link from "next/link";
import { Calendar, Globe, MapPin, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getInitials } from "@/utils/utils";
import { CompetitionManagementTableDTO } from "@/modules/competitions/backend/authorization/dto";

export default function AdminCompetitionsCards({
  competitions,
}: {
  competitions: CompetitionManagementTableDTO[];
}) {
  return (
    <div className="space-y-8">
      {/* Header */}

      {/* Grid */}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {competitions.map((competition) => (
          <Link
            key={competition.id}
            href={`/admin/competitions/${competition.id}`}
            className="group"
          >
            <Card className="overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-xl flex h-fit flex-col">
              <CardHeader className="space-y-4 ">
                <div className="flex items-center gap-4">
                  <Avatar className=" h-12 w-12 ">
                    <AvatarImage
                      src={competition.logoUrl ?? undefined}
                      alt={competition.organizer || "Competition Logo"}
                      className="bg-red-700"
                    />
                    <AvatarFallback>
                      {getInitials(competition.title)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1 items-center  justify-center h-full">
                    <CardTitle className="line-clamp-1">
                      {competition.title}
                    </CardTitle>

                    <CardDescription className="line-clamp-1">
                      {competition.organizer}
                    </CardDescription>
                  </div>
                </div>

               
              </CardHeader>
              <CardFooter>
               <Badge className={`${competition.visibility == "PRIVATE" && "bg-destructive" }`}> {competition.visibility}</Badge>
              </CardFooter>

              
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
