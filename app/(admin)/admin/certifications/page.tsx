"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, LayoutGrid, List, Edit, Trash, Archive, ArchiveRestore, Eye, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { useCertifications } from "@/modules/certifications/hooks/useCertifications";
import { useDeleteCertification } from "@/modules/certifications/hooks/useDeleteCertification";
import { useArchiveCertification } from "@/modules/certifications/hooks/useArchiveCertification";
import { deleteCertification as deleteCertificationAction } from "@/modules/certifications/serverActions/certification.action";
import { archiveCertification as archiveCertificationAction } from "@/modules/certifications/serverActions/certification.action";
import { CertificationForm } from "@/modules/certifications/ui/CertificationForm";
import { CertificationCreationDialog } from "@/modules/certifications/ui/CertificationCreationDialog";
import { CertificationPDFUploadForm } from "@/modules/certifications/ui/CertificationPDFUploadForm";
import { DomainWeightChart } from "@/modules/certifications/ui/DomainWeightChart";
import { EmbeddingStatusBadge } from "@/modules/content/ui/EmbeddingStatusBadge";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

type Certification = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isScoredExam: boolean;
  passingScore: number | null;
  maxScore: number | null;
  defaultStudyDuration: number;
  isActive: boolean;
  isArchived: boolean;
  _count: {
    domains: number;
    currentStudents: number;
  };
};

export default function CertificationsPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = React.useState<"card" | "table">("card");
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<"all" | "active" | "inactive" | "archived">("all");
  const [sortBy, setSortBy] = React.useState<"name" | "code">("name");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize] = React.useState(10);
  const [creationDialogOpen, setCreationDialogOpen] = React.useState(false);
  const [pdfUploadOpen, setPdfUploadOpen] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);
  const [formInEditMode, setFormInEditMode] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = React.useState(false);
  const [selectedCertification, setSelectedCertification] = React.useState<Certification | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const { data: response, isLoading } = useCertifications({ search, status, sortBy, sortOrder });
  const deleteCertification = useDeleteCertification();
  const archiveCertification = useArchiveCertification();

  const certifications = response?.data || [];

  // Sorting handler
  const handleSort = (column: "name" | "code") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Pagination for table view
  const totalPages = Math.ceil(certifications.length / pageSize);
  const paginatedCertifications = viewMode === "table"
    ? certifications.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : certifications;

  const handleView = (cert: Certification) => {
    setSelectedCertification(cert);
    setFormInEditMode(false);
    setFormOpen(true);
  };

  const handleEdit = (cert: Certification) => {
    setSelectedCertification(cert);
    setFormInEditMode(true);
    setFormOpen(true);
  };

  const handleDeleteClick = (cert: Certification) => {
    setSelectedCertification(cert);
    setShowDeleteConfirm(true);
  };

  const handleArchiveClick = (cert: Certification) => {
    setSelectedCertification(cert);
    setShowArchiveConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedCertification?.id) return;
    const result = await deleteCertification.mutateAsync({ id: selectedCertification.id });
    if (result.success) {
      setSelectedCertification(null);
    }
  };

  const confirmArchive = async () => {
    if (!selectedCertification?.id) return;
    const result = await archiveCertification.mutateAsync({
      id: selectedCertification.id,
      isArchived: true
    });
    if (result.success) {
      setSelectedCertification(null);
    }
  };

  const handleCreateNew = () => {
    setCreationDialogOpen(true);
  };

  const handleCreationModeSelect = (mode: "pdf" | "manual") => {
    if (mode === "pdf") {
      setPdfUploadOpen(true);
    } else {
      setSelectedCertification(null);
      setFormOpen(true);
    }
  };

  const handlePdfUploadBack = () => {
    setPdfUploadOpen(false);
    setCreationDialogOpen(true);
  };

  // Bulk selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === certifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(certifications.map((c) => c.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const count = selectedIds.length;
    const toastId = toast.loading(`Deleting ${count} certification${count !== 1 ? "s" : ""}...`);

    try {
      // Execute all deletions in parallel using server actions directly (no individual toasts)
      const results = await Promise.all(
        selectedIds.map((id) => deleteCertificationAction({ id }))
      );

      const failed = results.filter((r) => !r.success);
      if (failed.length > 0) {
        toast.error(
          `Deleted ${count - failed.length} of ${count} certification${count !== 1 ? "s" : ""}`,
          { id: toastId }
        );
      } else {
        toast.success(`Successfully deleted ${count} certification${count !== 1 ? "s" : ""}`, {
          id: toastId,
        });
      }

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["certifications"] });
      setSelectedIds([]);
    } catch {
      toast.error(`Failed to delete certifications`, { id: toastId });
    }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return;

    const count = selectedIds.length;
    const toastId = toast.loading(`Archiving ${count} certification${count !== 1 ? "s" : ""}...`);

    try {
      // Execute all archives in parallel using server actions directly (no individual toasts)
      const results = await Promise.all(
        selectedIds.map((id) => archiveCertificationAction({ id, isArchived: true }))
      );

      const failed = results.filter((r) => !r.success);
      if (failed.length > 0) {
        toast.error(
          `Archived ${count - failed.length} of ${count} certification${count !== 1 ? "s" : ""}`,
          { id: toastId }
        );
      } else {
        toast.success(`Successfully archived ${count} certification${count !== 1 ? "s" : ""}`, {
          id: toastId,
        });
      }

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["certifications"] });
      setSelectedIds([]);
    } catch {
      toast.error(`Failed to archive certifications`, { id: toastId });
    }
  };

  const handleBulkUnarchive = async () => {
    if (selectedIds.length === 0) return;

    const count = selectedIds.length;
    const toastId = toast.loading(`Unarchiving ${count} certification${count !== 1 ? "s" : ""}...`);

    try {
      // Execute all unarchives in parallel using server actions directly (no individual toasts)
      const results = await Promise.all(
        selectedIds.map((id) => archiveCertificationAction({ id, isArchived: false }))
      );

      const failed = results.filter((r) => !r.success);
      if (failed.length > 0) {
        toast.error(
          `Unarchived ${count - failed.length} of ${count} certification${count !== 1 ? "s" : ""}`,
          { id: toastId }
        );
      } else {
        toast.success(`Successfully unarchived ${count} certification${count !== 1 ? "s" : ""}`, {
          id: toastId,
        });
      }

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["certifications"] });
      setSelectedIds([]);
    } catch {
      toast.error(`Failed to unarchive certifications`, { id: toastId });
    }
  };

  const isAllSelected = certifications.length > 0 && selectedIds.length === certifications.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < certifications.length;

  // Reset to first page when search or status changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, status]);

  // Ensure clean state when modal closes
  React.useEffect(() => {
    if (!formOpen && !showDeleteConfirm && !showArchiveConfirm) {
      // Small delay to ensure modal overlay is fully removed
      const timer = setTimeout(() => {
        setSelectedCertification(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [formOpen, showDeleteConfirm, showArchiveConfirm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certification Management</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage certification courses
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Certification
        </Button>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search certifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Status: {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatus("all")}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatus("active")}>Active</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatus("inactive")}>Inactive</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatus("archived")}>Archived</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === "card" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("card")}
            aria-label="Card view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            aria-label="Table view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="rounded-lg border bg-muted/50 p-3 flex items-center justify-between">
          <p className="text-sm font-medium">
            {selectedIds.length} certification{selectedIds.length !== 1 ? "s" : ""} selected
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkArchive}
              disabled={archiveCertification.isPending}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkUnarchive}
              disabled={archiveCertification.isPending}
            >
              <ArchiveRestore className="h-4 w-4 mr-2" />
              Unarchive Selected
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={deleteCertification.isPending}
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className={viewMode === "card" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-2"}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && certifications.length === 0 && (
        <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center">
          <div className="mx-auto max-w-md">
            <h3 className="text-lg font-semibold mb-2">No certifications found</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {search ? "Try adjusting your search or filters." : "Get started by creating your first certification course."}
            </p>
            {!search && (
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Certification
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Card View */}
      {!isLoading && certifications.length > 0 && viewMode === "card" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" key={`cards-${formOpen}`}>
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className={`relative rounded-lg border bg-card hover:shadow-md transition-shadow ${
                selectedIds.includes(cert.id) ? "ring-2 ring-primary" : ""
              }`}
            >
              {/* Status badge in bottom left corner */}
              <div className="absolute bottom-3 left-3 z-10">
                {cert.isActive && !cert.isArchived && (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    Active
                  </span>
                )}
                {!cert.isActive && !cert.isArchived && (
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    Inactive
                  </span>
                )}
                {cert.isArchived && (
                  <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                    Archived
                  </span>
                )}
              </div>

              {/* AI Mapping badge in bottom right corner */}
              <div className="absolute bottom-3 right-3 z-10">
                <EmbeddingStatusBadge certificationId={cert.id} />
              </div>

              {/* Clickable card area */}
              <div
                onClick={() => handleView(cert)}
                className="p-4 pb-12 cursor-pointer"
              >
                <div className="flex gap-4">
                  {/* Left section - Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedIds.includes(cert.id)}
                        onCheckedChange={() => handleToggleSelect(cert.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${cert.name}`}
                      />
                      <div className="space-y-1 flex-1">
                        <h3 className="font-semibold leading-none">{cert.name}</h3>
                        <p className="text-sm text-muted-foreground">{cert.code}</p>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Score:</span>
                        <span>
                          {cert.isScoredExam
                            ? `${cert.passingScore}/${cert.maxScore}`
                            : "Pass/Fail"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span>{cert.defaultStudyDuration} days</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Students:</span>
                        <span>{cert._count.currentStudents}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right section - Chart */}
                  <div
                    className="flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DomainWeightChart certificationId={cert.id} size={110} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {!isLoading && certifications.length > 0 && viewMode === "table" && (
        <>
          <div className="rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="w-12 p-3" role="columnheader">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all certifications"
                        className={isSomeSelected && !isAllSelected ? "opacity-50" : ""}
                      />
                    </th>
                    <th className="text-left p-3 font-medium w-32" role="columnheader">Actions</th>
                    <th
                      className="text-left p-3 font-medium cursor-pointer hover:bg-muted/70"
                      role="columnheader"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        Name
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th
                      className="text-left p-3 font-medium cursor-pointer hover:bg-muted/70"
                      role="columnheader"
                      onClick={() => handleSort("code")}
                    >
                      <div className="flex items-center gap-1">
                        Code
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="text-left p-3 font-medium" role="columnheader">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCertifications.map((cert) => {
                    const hasEnrolledStudents = (cert._count?.currentStudents ?? 0) > 0;
                    const showArchive = hasEnrolledStudents;
                    const showDelete = !hasEnrolledStudents;

                    return (
                      <tr
                        key={cert.id}
                        className={`border-b last:border-0 hover:bg-muted/30 ${
                          selectedIds.includes(cert.id) ? "bg-muted/50" : ""
                        }`}
                      >
                        <td className="p-3">
                          <Checkbox
                            checked={selectedIds.includes(cert.id)}
                            onCheckedChange={() => handleToggleSelect(cert.id)}
                            aria-label={`Select ${cert.name}`}
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(cert)}
                              aria-label="View certification"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(cert)}
                              aria-label="Edit certification"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {showDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(cert)}
                                className="text-destructive hover:text-destructive"
                                aria-label="Delete certification"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            )}
                            {showArchive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleArchiveClick(cert)}
                                className="text-orange-600 hover:text-orange-600"
                                aria-label="Archive certification"
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                        <td className="p-3 font-medium">{cert.name}</td>
                        <td className="p-3 text-muted-foreground">{cert.code}</td>
                        <td className="p-3">
                          {cert.isActive && !cert.isArchived && (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                              Active
                            </span>
                          )}
                          {!cert.isActive && !cert.isArchived && (
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              Inactive
                            </span>
                          )}
                          {cert.isArchived && (
                            <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                              Archived
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, certifications.length)} of {certifications.length} certifications
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Results Count */}
      {!isLoading && certifications.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {certifications.length} certification{certifications.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Dialogs */}
      <CertificationCreationDialog
        open={creationDialogOpen}
        onOpenChange={setCreationDialogOpen}
        onSelectMode={handleCreationModeSelect}
      />

      <CertificationPDFUploadForm
        open={pdfUploadOpen}
        onOpenChange={setPdfUploadOpen}
        onBack={handlePdfUploadBack}
      />

      <CertificationForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setSelectedCertification(null);
            setFormInEditMode(false);
          }
        }}
        certification={selectedCertification || undefined}
        startInEditMode={formInEditMode}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Certification"
        description={`You are about to permanently delete "${selectedCertification?.name} (${selectedCertification?.code})".\n\nThis action cannot be undone and will delete all blueprint data.`}
        confirmText="Delete"
        requireTypedConfirmation={true}
        confirmationWord="Confirm"
        onConfirm={confirmDelete}
        variant="danger"
      />

      {/* Archive Confirmation Dialog */}
      <ConfirmationDialog
        open={showArchiveConfirm}
        onOpenChange={setShowArchiveConfirm}
        title="Archive Certification"
        description={`You are about to archive "${selectedCertification?.name} (${selectedCertification?.code})".\n\nThis certification will be hidden from active students and cannot be re-assigned.`}
        confirmText="Archive"
        requireTypedConfirmation={true}
        confirmationWord="Confirm"
        onConfirm={confirmArchive}
        variant="warning"
      />
    </div>
  );
}
