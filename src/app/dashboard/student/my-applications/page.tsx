"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getMyApplications,
  type Application,
} from "@/lib/action";
import { cancelApplication } from "@/lib/mutation";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  CalendarDays,
  Clock,
  User,
  Mail,
  Trash2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export default function MyApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await getMyApplications();
      setApplications(data);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load applications"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadApplications = async () => {
      try {
        const data = await getMyApplications();
        if (!cancelled) setApplications(data);
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to load applications"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadApplications();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCancel = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this application?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      await cancelApplication(id);

      setApplications((prev) =>
        prev.filter((application) => application.id !== id)
      );

      toast.success("Application cancelled successfully");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to cancel application"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: Application["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            Pending
          </Badge>
        );

      case "accepted":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            Accepted
          </Badge>
        );

      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            Rejected
          </Badge>
        );

      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            My Applications
          </h1>
          <p className="text-muted-foreground mt-1">
            Track all your tuition applications in one place.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={fetchApplications}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Applications
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  {applications.length}
                </h2>
              </div>

              <BookOpen className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Pending
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  {
                    applications.filter(
                      (application) => application.status === "pending"
                    ).length
                  }
                </h2>
              </div>

              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Accepted
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  {
                    applications.filter(
                      (application) => application.status === "accepted"
                    ).length
                  }
                </h2>
              </div>

              <User className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications */}
      {applications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-muted p-5">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
            </div>

            <h3 className="text-lg font-semibold">
              No Applications Yet
            </h3>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              You haven&apos;t applied for any tuition yet.
              Browse available tuitions and apply to find your tutor.
            </p>

            <Button
              className="mt-5"
              onClick={() =>
                router.push("/dashboard/student/browse-tuitions")
              }
            >
              Browse Tuitions
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <Card
              key={application.id}
              className="overflow-hidden transition-shadow hover:shadow-md"
            >
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  {/* Tuition Information */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {application.tuitionTitle}
                      </h3>

                      {getStatusBadge(application.status)}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* Tutor */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4 shrink-0" />

                        <span>
                          {application.tutorName || "Unknown Tutor"}
                        </span>
                      </div>

                      {/* Tutor Email */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4 shrink-0" />

                        <span className="break-all">
                          {application.tutorEmail || "Not available"}
                        </span>
                      </div>

                      {/* Monthly Fee */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">
                          Monthly Fee:
                        </span>

                        <span className="font-semibold text-primary">
                          ৳{application.monthlyFee || 0}
                        </span>
                      </div>

                      {/* Applied Date */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4 shrink-0" />

                        <span>
                          Applied{" "}
                          {application.createdAt
                            ? new Date(
                                application.createdAt
                              ).toLocaleDateString("en-BD", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "Recently"}
                        </span>
                      </div>
                    </div>

                    {/* Preferred Schedule */}
                    {application.preferredSchedule && (
                      <div className="text-sm">
                        <span className="font-medium">
                          Preferred Schedule:
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {application.preferredSchedule}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  {application.status === "pending" && (
                    <div className="flex shrink-0">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deletingId === application.id}
                        onClick={() =>
                          handleCancel(application.id)
                        }
                        className="gap-2"
                      >
                        {deletingId === application.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}

                        Cancel Application
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}