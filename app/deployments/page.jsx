"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Users,
  Target,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Container,
  Cpu,
  MemoryStick,
  FileText,
  RotateCcw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import DeploymentLogsDialog from "@/components/DeploymentLogsDialog";

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [namespaceFilter, setNamespaceFilter] = useState("all");
  const [hideKubeSystem, setHideKubeSystem] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hideKubeSystemDeployments");
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedDeployment, setSelectedDeployment] = useState(null);
  const [deploymentDetail, setDeploymentDetail] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [deploymentPods, setDeploymentPods] = useState([]);
  const [podsLoading, setPodsLoading] = useState(false);
  const [podsError, setPodsError] = useState(null);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  useEffect(() => {
    fetchDeployments();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "hideKubeSystemDeployments",
        JSON.stringify(hideKubeSystem)
      );
    }
  }, [hideKubeSystem]);

  const fetchDeployments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/deployments`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch deployments");
      }
      const data = await response.json();
      setDeployments(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeploymentDetail = async (deploymentName, namespace) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/deployments/${deploymentName}?namespace=${namespace}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch deployment details");
      }
      const data = await response.json();
      setDeploymentDetail(data.data);
    } catch (err) {
      setDetailError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchDeploymentPods = async (deploymentName, namespace) => {
    setPodsLoading(true);
    setPodsError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/deployments/${deploymentName}/pods?namespace=${namespace}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch deployment pods");
      }
      const data = await response.json();
      setDeploymentPods(data.data || []);
    } catch (err) {
      setPodsError(err.message);
    } finally {
      setPodsLoading(false);
    }
  };

  const handleDeploymentClick = (deployment) => {
    setSelectedDeployment(deployment);
    setSheetOpen(true);
    fetchDeploymentDetail(
      deployment.metadata?.name,
      deployment.metadata?.namespace
    );
    fetchDeploymentPods(
      deployment.metadata?.name,
      deployment.metadata?.namespace
    );
  };

  const getStatusBadge = (deployment) => {
    const readyReplicas = deployment.status?.readyReplicas || 0;
    const replicas = deployment.spec?.replicas || 0;
    const availableReplicas = deployment.status?.availableReplicas || 0;

    if (
      readyReplicas === replicas &&
      availableReplicas === replicas &&
      replicas > 0
    ) {
      return (
        <Badge className="bg-green-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          Available
        </Badge>
      );
    } else if (readyReplicas > 0) {
      return (
        <Badge variant="secondary" className="bg-yellow-500">
          <Clock className="h-3 w-3 mr-1" />
          Progressing
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Unavailable
        </Badge>
      );
    }
  };

  const getReplicasBadge = (deployment) => {
    const readyReplicas = deployment.status?.readyReplicas || 0;
    const replicas = deployment.spec?.replicas || 0;
    const isReady = readyReplicas === replicas && replicas > 0;

    return (
      <Badge
        variant={isReady ? "default" : "destructive"}
        className={isReady ? "bg-green-500" : ""}
      >
        {readyReplicas}/{replicas}
      </Badge>
    );
  };

  const getUpdatesBadge = (deployment) => {
    const updatedReplicas = deployment.status?.updatedReplicas || 0;
    const replicas = deployment.spec?.replicas || 0;
    const isUpdated = updatedReplicas === replicas;

    return (
      <Badge variant={isUpdated ? "default" : "secondary"}>
        {updatedReplicas}
      </Badge>
    );
  };

  const formatAge = (timestamp) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now - created;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays}d`;
    } else if (diffHours > 0) {
      return `${diffHours}h`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-4 w-4 ml-1" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };

  const sortDeployments = (deployments) => {
    if (!sortField) return deployments;

    return [...deployments].sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case "name":
          aValue = a.metadata?.name || "";
          bValue = b.metadata?.name || "";
          break;
        case "namespace":
          aValue = a.metadata?.namespace || "";
          bValue = b.metadata?.namespace || "";
          break;
        case "ready":
          aValue = (a.status?.readyReplicas || 0) / (a.spec?.replicas || 1);
          bValue = (b.status?.readyReplicas || 0) / (b.spec?.replicas || 1);
          break;
        case "replicas":
          aValue = a.spec?.replicas || 0;
          bValue = b.spec?.replicas || 0;
          break;
        case "updated":
          aValue = a.status?.updatedReplicas || 0;
          bValue = b.status?.updatedReplicas || 0;
          break;
        case "available":
          aValue = a.status?.availableReplicas || 0;
          bValue = b.status?.availableReplicas || 0;
          break;
        case "age":
          aValue = new Date(a.metadata?.creationTimestamp || 0);
          bValue = new Date(b.metadata?.creationTimestamp || 0);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  const restartDeployment = async (deploymentName, namespace) => {
    setIsRestarting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/deployments/${deploymentName}/restart?namespace=${namespace}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to restart deployment");
      }

      // Refresh deployment details and pods after restart
      fetchDeploymentDetail(deploymentName, namespace);
      fetchDeploymentPods(deploymentName, namespace);

      // Optional: Show success feedback
      // You could add a toast notification here
    } catch (err) {
      // Handle error - you could show an error toast here
      console.error("Failed to restart deployment:", err);
      setDetailError(err.message);
    } finally {
      setIsRestarting(false);
    }
  };

  const getPodStatusBadge = (pod) => {
    const phase = pod.status?.phase;
    const ready = pod.status?.ready;

    if (ready === false) {
      const containerWithReason = pod.status?.containerStatuses?.find(
        (container) => container.state?.waiting?.reason
      );

      if (containerWithReason) {
        const reason = containerWithReason.state.waiting.reason;
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            {reason}
          </Badge>
        );
      }
    }

    switch (phase) {
      case "Running":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Running
          </Badge>
        );
      case "Pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "Failed":
      case "Error":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            {phase}
          </Badge>
        );
      case "Succeeded":
        return (
          <Badge className="bg-blue-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Succeeded
          </Badge>
        );
      default:
        return <Badge variant="outline">{phase || "Unknown"}</Badge>;
    }
  };

  const getPodReadyBadge = (pod) => {
    const readyContainers =
      pod.status?.containerStatuses?.filter((c) => c.ready).length || 0;
    const totalContainers = pod.status?.containerStatuses?.length || 0;
    const isReady = readyContainers === totalContainers && totalContainers > 0;

    return (
      <Badge
        variant={isReady ? "default" : "destructive"}
        className={isReady ? "bg-green-500" : ""}
      >
        {readyContainers}/{totalContainers}
      </Badge>
    );
  };

  const getTotalRestarts = (pod) => {
    return (
      pod.status?.containerStatuses?.reduce(
        (total, container) => total + (container.restartCount || 0),
        0
      ) || 0
    );
  };

  const formatCpuUsage = (pod) => {
    return pod.metrics?.usage?.cpu?.millicores
      ? `${pod.metrics.usage.cpu.millicores}m`
      : "0m";
  };

  const formatMemoryUsage = (pod) => {
    return pod.metrics?.usage?.memory?.megabytes
      ? `${pod.metrics.usage.memory.megabytes}Mi`
      : "0Mi";
  };

  const uniqueNamespaces = [
    "all",
    ...new Set(deployments.map((deployment) => deployment.metadata?.namespace)),
  ];

  const filteredDeployments = sortDeployments(
    deployments.filter((deployment) => {
      const matchesNamespace =
        namespaceFilter === "all" ||
        deployment.metadata?.namespace === namespaceFilter;

      const matchesKubeSystemFilter =
        !hideKubeSystem || deployment.metadata?.namespace !== "kube-system";

      return matchesNamespace && matchesKubeSystemFilter;
    })
  );

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>K3s Deployments</CardTitle>
            <CardDescription>Loading deployments...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load deployments: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>K3s Deployments</CardTitle>
              <CardDescription>
                Monitor and manage deployments across all namespaces
              </CardDescription>
            </div>
            <div className="flex gap-4 items-center">
              <Select
                value={namespaceFilter}
                onValueChange={setNamespaceFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by namespace" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueNamespaces.map((namespace) => (
                    <SelectItem key={namespace} value={namespace}>
                      {namespace === "all" ? "All Namespaces" : namespace}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Switch
                  id="hide-kube-system"
                  checked={hideKubeSystem}
                  onCheckedChange={setHideKubeSystem}
                />
                <Label
                  htmlFor="hide-kube-system"
                  className="text-sm font-medium"
                >
                  Hide kube-system
                </Label>
              </div>

              <Button variant="outline" size="icon" onClick={fetchDeployments}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>
                {filteredDeployments.length} deployments found
                {namespaceFilter !== "all" &&
                  ` in ${namespaceFilter} namespace`}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      Name
                      {getSortIcon("name")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort("namespace")}
                  >
                    <div className="flex items-center">
                      Namespace
                      {getSortIcon("namespace")}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort("ready")}
                  >
                    <div className="flex items-center">
                      Ready
                      {getSortIcon("ready")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort("updated")}
                  >
                    <div className="flex items-center">
                      Up-to-date
                      {getSortIcon("updated")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort("available")}
                  >
                    <div className="flex items-center">
                      Available
                      {getSortIcon("available")}
                    </div>
                  </TableHead>
                  <TableHead>Containers</TableHead>
                  <TableHead>Images</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort("age")}
                  >
                    <div className="flex items-center">
                      Age
                      {getSortIcon("age")}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeployments.map((deployment) => {
                  return (
                    <TableRow
                      key={`${deployment.metadata?.namespace}/${deployment.metadata?.name}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleDeploymentClick(deployment)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4" />
                          <span className="font-mono text-sm">
                            {deployment.metadata?.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {deployment.metadata?.namespace}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(deployment)}</TableCell>
                      <TableCell>{getReplicasBadge(deployment)}</TableCell>
                      <TableCell>{getUpdatesBadge(deployment)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {deployment.status?.availableReplicas || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {deployment.spec?.template?.spec?.containers?.length >
                          0 ? (
                            deployment.spec.template.spec.containers.length ===
                            1 ? (
                              <span className="font-mono text-xs">
                                {
                                  deployment.spec.template.spec.containers[0]
                                    .name
                                }
                              </span>
                            ) : (
                              <div className="space-y-1">
                                {deployment.spec.template.spec.containers
                                  .slice(0, 2)
                                  .map((container, idx) => (
                                    <div
                                      key={idx}
                                      className="font-mono text-xs"
                                    >
                                      {container.name}
                                    </div>
                                  ))}
                                {deployment.spec.template.spec.containers
                                  .length > 2 && (
                                  <span className="text-xs text-muted-foreground">
                                    +
                                    {deployment.spec.template.spec.containers
                                      .length - 2}{" "}
                                    more
                                  </span>
                                )}
                              </div>
                            )
                          ) : (
                            "-"
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate font-mono text-xs">
                          {deployment.spec?.template?.spec?.containers?.[0]
                            ?.image || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatAge(deployment.metadata?.creationTimestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Users className="h-3 w-3 mr-1" />
                            Scale
                          </Button>
                          <Button variant="outline" size="sm">
                            <Target className="h-3 w-3 mr-1" />
                            Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Deployment Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          className="w-[40vw] !max-w-none overflow-y-auto"
          side="right"
        >
          <SheetHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-xl">Deployment Details</SheetTitle>
                <SheetDescription asChild>
                  <div className="text-base">
                    {selectedDeployment ? (
                      <div className="space-y-1">
                        <div className="font-mono text-sm break-all">
                          {selectedDeployment.metadata?.name}
                        </div>
                        <div>
                          in{" "}
                          <Badge variant="outline">
                            {selectedDeployment.metadata?.namespace}
                          </Badge>{" "}
                          namespace
                        </div>
                      </div>
                    ) : (
                      "Loading..."
                    )}
                  </div>
                </SheetDescription>
              </div>
              {selectedDeployment && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSheetOpen(false);
                      setLogsDialogOpen(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Logs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      restartDeployment(
                        selectedDeployment.metadata?.name,
                        selectedDeployment.metadata?.namespace
                      )
                    }
                    disabled={isRestarting}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw
                      className={`h-4 w-4 ${
                        isRestarting ? "animate-spin" : ""
                      }`}
                    />
                    {isRestarting ? "Restarting..." : "Restart"}
                  </Button>
                </div>
              )}
            </div>
          </SheetHeader>

          {detailLoading ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : detailError ? (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load deployment details: {detailError}
              </AlertDescription>
            </Alert>
          ) : deploymentDetail ? (
            <div className="space-y-5 px-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Name
                        </span>
                        <div className="font-mono text-sm mt-1 p-2 bg-muted rounded">
                          {deploymentDetail.metadata?.name}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Namespace
                        </span>
                        <div className="mt-1">
                          <Badge variant="outline">
                            {deploymentDetail.metadata?.namespace}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Status
                        </span>
                        <div className="mt-1">
                          {getStatusBadge(deploymentDetail)}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Replicas
                        </span>
                        <div className="text-sm mt-1 p-2 bg-muted rounded">
                          Desired: {deploymentDetail.spec?.replicas || 0} |
                          Ready: {deploymentDetail.status?.readyReplicas || 0} |
                          Available:{" "}
                          {deploymentDetail.status?.availableReplicas || 0}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Strategy
                        </span>
                        <div className="text-sm mt-1 p-2 bg-muted rounded">
                          {deploymentDetail.spec?.strategy?.type ||
                            "RollingUpdate"}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Age
                        </span>
                        <div className="text-sm mt-1 p-2 bg-muted rounded">
                          {formatAge(
                            deploymentDetail.metadata?.creationTimestamp
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Deployment Strategy */}
              {deploymentDetail.spec?.strategy && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Deployment Strategy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Strategy Type
                        </span>
                        <div className="font-mono text-sm mt-1 p-2 bg-muted rounded">
                          {deploymentDetail.spec.strategy.type}
                        </div>
                      </div>
                      {deploymentDetail.spec.strategy.rollingUpdate && (
                        <>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">
                              Max Surge
                            </span>
                            <div className="font-mono text-sm mt-1 p-2 bg-muted rounded">
                              {
                                deploymentDetail.spec.strategy.rollingUpdate
                                  .maxSurge
                              }
                            </div>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">
                              Max Unavailable
                            </span>
                            <div className="font-mono text-sm mt-1 p-2 bg-muted rounded">
                              {
                                deploymentDetail.spec.strategy.rollingUpdate
                                  .maxUnavailable
                              }
                            </div>
                          </div>
                        </>
                      )}
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Progress Deadline
                        </span>
                        <div className="font-mono text-sm mt-1 p-2 bg-muted rounded">
                          {deploymentDetail.spec?.progressDeadlineSeconds ||
                            600}
                          s
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pods */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Pods ({deploymentPods.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {podsLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ) : podsError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Failed to load pods: {podsError}
                      </AlertDescription>
                    </Alert>
                  ) : deploymentPods.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Restarts</TableHead>
                            <TableHead>Ready</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>CPU</TableHead>
                            <TableHead>Memory</TableHead>
                            <TableHead>IP</TableHead>
                            <TableHead>Node</TableHead>
                            <TableHead>Age</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {deploymentPods.map((pod) => {
                            const restarts = getTotalRestarts(pod);
                            return (
                              <TableRow key={pod.metadata?.name}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center space-x-2">
                                    <Container className="h-4 w-4" />
                                    <span className="font-mono text-sm">
                                      {pod.metadata?.name}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span
                                    className={
                                      restarts > 0
                                        ? "text-yellow-600 font-medium"
                                        : ""
                                    }
                                  >
                                    {restarts}
                                  </span>
                                </TableCell>
                                <TableCell>{getPodReadyBadge(pod)}</TableCell>
                                <TableCell>{getPodStatusBadge(pod)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-1">
                                    <Cpu className="h-3 w-3" />
                                    <span className="font-mono text-sm">
                                      {formatCpuUsage(pod)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-1">
                                    <MemoryStick className="h-3 w-3" />
                                    <span className="font-mono text-sm">
                                      {formatMemoryUsage(pod)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="font-mono text-sm">
                                    {pod.status?.podIP || "-"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {pod.spec?.nodeName || "-"}
                                </TableCell>
                                <TableCell>
                                  {formatAge(pod.metadata?.creationTimestamp)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No pods found for this deployment
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Containers */}
              {deploymentDetail.spec?.template?.spec?.containers && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Containers (
                      {deploymentDetail.spec.template.spec.containers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {deploymentDetail.spec.template.spec.containers.map(
                        (container, index) => (
                          <div
                            key={index}
                            className="border rounded-lg p-4 space-y-4"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-lg font-semibold flex items-center gap-2">
                                <Container className="h-5 w-5" />
                                {container.name}
                              </h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">
                                    Image
                                  </span>
                                  <div className="font-mono text-sm mt-1 p-2 bg-muted rounded break-all">
                                    {container.image}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">
                                    Image Pull Policy
                                  </span>
                                  <div className="text-sm mt-1 p-2 bg-muted rounded">
                                    {container.imagePullPolicy ||
                                      "IfNotPresent"}
                                  </div>
                                </div>
                                {container.ports &&
                                  container.ports.length > 0 && (
                                    <div>
                                      <span className="text-sm font-medium text-muted-foreground">
                                        Ports
                                      </span>
                                      <div className="mt-1 space-y-1">
                                        {container.ports.map((port, idx) => (
                                          <Badge key={idx} variant="outline">
                                            {port.containerPort}/
                                            {port.protocol || "TCP"}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                              </div>

                              <div className="space-y-3">
                                {/* Resources */}
                                {container.resources && (
                                  <div>
                                    <span className="text-sm font-medium text-muted-foreground">
                                      Resource Requirements
                                    </span>
                                    <div className="grid grid-cols-1 gap-2 mt-2">
                                      {container.resources.requests && (
                                        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded">
                                          <div className="font-medium text-sm text-blue-700 dark:text-blue-300">
                                            Requests
                                          </div>
                                          <div className="text-sm">
                                            CPU:{" "}
                                            {container.resources.requests.cpu ||
                                              "-"}
                                          </div>
                                          <div className="text-sm">
                                            Memory:{" "}
                                            {container.resources.requests
                                              .memory || "-"}
                                          </div>
                                        </div>
                                      )}
                                      {container.resources.limits && (
                                        <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded">
                                          <div className="font-medium text-sm text-orange-700 dark:text-orange-300">
                                            Limits
                                          </div>
                                          <div className="text-sm">
                                            CPU:{" "}
                                            {container.resources.limits.cpu ||
                                              "-"}
                                          </div>
                                          <div className="text-sm">
                                            Memory:{" "}
                                            {container.resources.limits
                                              .memory || "-"}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Environment Variables */}
                            {container.env && container.env.length > 0 && (
                              <div className="pt-3 border-t">
                                <span className="text-sm font-medium text-muted-foreground">
                                  Environment Variables ({container.env.length})
                                </span>
                                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                                  {container.env.map((env, envIdx) => (
                                    <div
                                      key={envIdx}
                                      className="flex items-start space-x-3 p-2 bg-muted rounded text-sm"
                                    >
                                      <span className="font-mono font-medium text-blue-600 dark:text-blue-400 min-w-0 flex-1">
                                        {env.name}
                                      </span>
                                      <span className="text-muted-foreground">
                                        =
                                      </span>
                                      <span className="font-mono break-all min-w-0 flex-1">
                                        {env.value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Labels */}
              {deploymentDetail.metadata?.labels &&
                Object.keys(deploymentDetail.metadata.labels).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Labels (
                        {Object.keys(deploymentDetail.metadata.labels).length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(deploymentDetail.metadata.labels).map(
                          ([key, value]) => (
                            <Badge
                              key={key}
                              variant="outline"
                              className="text-xs font-mono"
                            >
                              {key}: {value}
                            </Badge>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Conditions */}
              {deploymentDetail.status?.conditions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Deployment Conditions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {deploymentDetail.status.conditions.map(
                        (condition, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <span className="font-medium">
                                {condition.type}
                              </span>
                              {condition.message && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {condition.message}
                                </div>
                              )}
                              {condition.lastTransitionTime && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Last transition:{" "}
                                  {new Date(
                                    condition.lastTransitionTime
                                  ).toLocaleString()}
                                </div>
                              )}
                            </div>
                            <Badge
                              variant={
                                condition.status === "True"
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                condition.status === "True"
                                  ? "bg-green-500"
                                  : ""
                              }
                            >
                              {condition.status}
                            </Badge>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Deployment Logs Dialog */}
      <DeploymentLogsDialog
        isOpen={logsDialogOpen}
        onClose={() => setLogsDialogOpen(false)}
        deployment={selectedDeployment}
        pods={deploymentPods}
      />
    </div>
  );
}
