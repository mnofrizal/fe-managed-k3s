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
  Container,
  Cpu,
  MemoryStick,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Terminal,
  FileText,
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
import PodTerminalDialog from "@/components/PodTerminalDialog";
import PodLogsDialog from "@/components/PodLogsDialog";

export default function PodsPage() {
  const [pods, setPods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [namespaceFilter, setNamespaceFilter] = useState("all");
  const [hideKubeSystem, setHideKubeSystem] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hideKubeSystem");
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [selectedPod, setSelectedPod] = useState(null);
  const [podDetail, setPodDetail] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [terminalDialogOpen, setTerminalDialogOpen] = useState(false);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);

  useEffect(() => {
    fetchPods();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hideKubeSystem", JSON.stringify(hideKubeSystem));
    }
  }, [hideKubeSystem]);

  const fetchPods = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/pods`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch pods");
      }
      const data = await response.json();
      setPods(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (pod) => {
    const phase = pod.status?.phase;
    const ready = pod.status?.ready;

    // If pod is not ready, check for container reasons
    if (ready === false) {
      // Look for container with waiting state and reason
      const containerWithReason = pod.containers?.find(
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

    // Use phase for status when ready=true or no container reason found
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

  const getReadyBadge = (pod) => {
    const readyContainers = pod.containers?.filter((c) => c.ready).length || 0;
    const totalContainers = pod.containers?.length || 0;
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
      pod.containers?.reduce(
        (total, container) => total + (container.restartCount || 0),
        0
      ) || 0
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

  const fetchPodDetail = async (podName, namespace) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/pods/${podName}?namespace=${namespace}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch pod details");
      }
      const data = await response.json();
      setPodDetail(data.data);
    } catch (err) {
      setDetailError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePodClick = (pod) => {
    setSelectedPod(pod);
    setSheetOpen(true);
    fetchPodDetail(pod.name, pod.namespace);
  };

  const uniqueNamespaces = [
    "all",
    ...new Set(pods.map((pod) => pod.namespace)),
  ];

  const filteredPods = pods.filter((pod) => {
    // Apply namespace filter
    const matchesNamespace =
      namespaceFilter === "all" || pod.namespace === namespaceFilter;

    // Apply kube-system filter
    const matchesKubeSystemFilter =
      !hideKubeSystem || pod.namespace !== "kube-system";

    return matchesNamespace && matchesKubeSystemFilter;
  });

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>K3s Pods</CardTitle>
            <CardDescription>Loading pods...</CardDescription>
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
          <AlertDescription>Failed to load pods: {error}</AlertDescription>
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
              <CardTitle>K3s Pods</CardTitle>
              <CardDescription>
                Monitor and manage running pods across all namespaces
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

              <Button variant="outline" size="icon" onClick={fetchPods}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>
                {filteredPods.length} pods found
                {namespaceFilter !== "all" &&
                  ` in ${namespaceFilter} namespace`}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Namespace</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ready</TableHead>
                  <TableHead>Restarts</TableHead>
                  <TableHead>CPU</TableHead>
                  <TableHead>Memory</TableHead>
                  <TableHead>Node</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPods.map((pod) => {
                  const restarts = getTotalRestarts(pod);
                  return (
                    <TableRow
                      key={pod.name}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handlePodClick(pod)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Container className="h-4 w-4" />
                          <span className="font-mono text-sm">{pod.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{pod.namespace}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(pod)}</TableCell>
                      <TableCell>{getReadyBadge(pod)}</TableCell>
                      <TableCell>
                        <span
                          className={
                            restarts > 0 ? "text-yellow-600 font-medium" : ""
                          }
                        >
                          {restarts}
                        </span>
                      </TableCell>
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
                      <TableCell>{pod.spec?.nodeName || "-"}</TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {pod.network?.podIP || "-"}
                        </span>
                      </TableCell>
                      <TableCell>{formatAge(pod.creationTimestamp)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Logs
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

      {/* Pod Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          className="w-[40vw] !max-w-none overflow-y-auto"
          side="right"
        >
          <SheetHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-xl">Pod Details</SheetTitle>
                <SheetDescription asChild>
                  <div className="text-base">
                    {selectedPod ? (
                      <div className="space-y-1">
                        <div className="font-mono text-sm break-all">
                          {selectedPod.name}
                        </div>
                        <div>
                          in{" "}
                          <Badge variant="outline">
                            {selectedPod.namespace}
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
              {selectedPod && (
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
                    onClick={() => {
                      setSheetOpen(false);
                      setTerminalDialogOpen(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Terminal className="h-4 w-4" />
                    Terminal
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
                Failed to load pod details: {detailError}
              </AlertDescription>
            </Alert>
          ) : podDetail ? (
            <div className="space-y-5 px-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Name
                        </span>
                        <div className="font-mono text-sm mt-1 p-2 bg-muted rounded">
                          {podDetail.name}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Namespace
                        </span>
                        <div className="mt-1">
                          <Badge variant="outline">{podDetail.namespace}</Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Status
                        </span>
                        <div className="mt-1">{getStatusBadge(podDetail)}</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Node
                        </span>
                        <div className="font-mono text-sm mt-1 p-2 bg-muted rounded">
                          {podDetail.spec?.nodeName || "-"}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Pod IP
                        </span>
                        <div className="font-mono text-sm mt-1 p-2 bg-muted rounded">
                          {podDetail.network?.podIP || "-"}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Host IP
                        </span>
                        <div className="font-mono text-sm mt-1 p-2 bg-muted rounded">
                          {podDetail.network?.hostIP || "-"}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Age
                        </span>
                        <div className="text-sm mt-1 p-2 bg-muted rounded">
                          {formatAge(podDetail.creationTimestamp)}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Restart Policy
                        </span>
                        <div className="text-sm mt-1 p-2 bg-muted rounded">
                          {podDetail.spec?.restartPolicy || "-"}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Service Account
                        </span>
                        <div className="text-sm mt-1 p-2 bg-muted rounded">
                          {podDetail.spec?.serviceAccount || "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resource Usage */}
              {podDetail.metrics && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resource Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            CPU Usage
                          </p>
                          <p className="text-2xl font-bold text-blue-600">
                            {formatCpuUsage(podDetail)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {podDetail.metrics.usage.cpu.cores.toFixed(3)} cores
                          </p>
                        </div>
                        <Cpu className="h-8 w-8 text-blue-500" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Memory Usage
                          </p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatMemoryUsage(podDetail)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {podDetail.metrics.usage.memory.gigabytes.toFixed(
                              2
                            )}{" "}
                            GB
                          </p>
                        </div>
                        <MemoryStick className="h-8 w-8 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Containers */}
              {podDetail.containers && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Containers ({podDetail.containers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {podDetail.containers.map((container, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-4 space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold flex items-center gap-2">
                              <Container className="h-5 w-5" />
                              {container.name}
                            </h4>
                            <Badge
                              variant={
                                container.ready ? "default" : "destructive"
                              }
                              className={container.ready ? "bg-green-500" : ""}
                            >
                              {container.ready ? "Ready" : "Not Ready"}
                            </Badge>
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
                                  Container ID
                                </span>
                                <div className="font-mono text-xs mt-1 p-2 bg-muted rounded break-all">
                                  {container.containerID || "-"}
                                </div>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-muted-foreground">
                                  State
                                </span>
                                <div className="mt-1">
                                  {container.state?.running ? (
                                    <Badge className="bg-green-500">
                                      Running since{" "}
                                      {new Date(
                                        container.state.running.startedAt
                                      ).toLocaleString()}
                                    </Badge>
                                  ) : container.state?.waiting ? (
                                    <Badge variant="destructive">
                                      {container.state.waiting.reason}
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary">Unknown</Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <span className="text-sm font-medium text-muted-foreground">
                                  Restart Count
                                </span>
                                <div className="text-sm mt-1 p-2 bg-muted rounded">
                                  {container.restartCount}
                                </div>
                              </div>
                              {container.ports && (
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">
                                    Ports
                                  </span>
                                  <div className="mt-1 space-y-1">
                                    {container.ports.map((port, idx) => (
                                      <Badge key={idx} variant="outline">
                                        {port.containerPort}/{port.protocol}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {container.lastState?.terminated && (
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">
                                    Last State
                                  </span>
                                  <div className="mt-1 p-2 bg-yellow-50 dark:bg-yellow-950 rounded text-sm">
                                    Terminated:{" "}
                                    {container.lastState.terminated.reason}{" "}
                                    (Exit:{" "}
                                    {container.lastState.terminated.exitCode})
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Resources */}
                          {container.resources && (
                            <div className="pt-3 border-t">
                              <span className="text-sm font-medium text-muted-foreground">
                                Resource Requirements
                              </span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded">
                                  <div className="font-medium text-sm text-blue-700 dark:text-blue-300">
                                    Requests
                                  </div>
                                  <div className="text-sm">
                                    CPU:{" "}
                                    {container.resources.requests?.cpu || "-"}
                                  </div>
                                  <div className="text-sm">
                                    Memory:{" "}
                                    {container.resources.requests?.memory ||
                                      "-"}
                                  </div>
                                </div>
                                <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded">
                                  <div className="font-medium text-sm text-orange-700 dark:text-orange-300">
                                    Limits
                                  </div>
                                  <div className="text-sm">
                                    CPU:{" "}
                                    {container.resources.limits?.cpu || "-"}
                                  </div>
                                  <div className="text-sm">
                                    Memory:{" "}
                                    {container.resources.limits?.memory || "-"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Environment Variables */}
                          {container.environment &&
                            container.environment.length > 0 && (
                              <div className="pt-3 border-t">
                                <span className="text-sm font-medium text-muted-foreground">
                                  Environment Variables (
                                  {container.environment.length})
                                </span>
                                <div className="mt-2 space-y-2">
                                  {container.environment.map((env, envIdx) => (
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
                                        {env.name
                                          .toLowerCase()
                                          .includes("password") ||
                                        env.name
                                          .toLowerCase()
                                          .includes("secret") ||
                                        env.name.toLowerCase().includes("key")
                                          ? env.value
                                          : env.value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          {/* Volume Mounts */}
                          {container.volumeMounts &&
                            container.volumeMounts.length > 0 && (
                              <div className="pt-3 border-t">
                                <span className="text-sm font-medium text-muted-foreground">
                                  Volume Mounts ({container.volumeMounts.length}
                                  )
                                </span>
                                <div className="mt-2 space-y-1">
                                  {container.volumeMounts.map(
                                    (mount, mountIdx) => (
                                      <div
                                        key={mountIdx}
                                        className="text-sm p-2 bg-muted rounded"
                                      >
                                        <div className="font-mono">
                                          {mount.mountPath}
                                        </div>
                                        <div className="text-muted-foreground text-xs">
                                          {mount.name}{" "}
                                          {mount.readOnly
                                            ? "(read-only)"
                                            : "(read-write)"}
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Labels */}
              {podDetail.labels && Object.keys(podDetail.labels).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Labels ({Object.keys(podDetail.labels).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(podDetail.labels).map(([key, value]) => (
                        <Badge
                          key={key}
                          variant="outline"
                          className="text-xs font-mono"
                        >
                          {key}: {value}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Network Info */}
              {podDetail.network && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Network</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Pod IP
                        </span>
                        <div className="font-mono text-sm mt-1 p-2 bg-muted rounded">
                          {podDetail.network.podIP || "-"}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Host IP
                        </span>
                        <div className="font-mono text-sm mt-1 p-2 bg-muted rounded">
                          {podDetail.network.hostIP || "-"}
                        </div>
                      </div>
                      {podDetail.network.ports &&
                        podDetail.network.ports.length > 0 && (
                          <div className="md:col-span-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              Network Ports
                            </span>
                            <div className="mt-1 space-y-1">
                              {podDetail.network.ports.map((port, idx) => (
                                <Badge key={idx} variant="outline">
                                  {port.containerPort}/{port.protocol}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Conditions */}
              {podDetail.status?.conditions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pod Conditions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {podDetail.status.conditions.map((condition, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <span className="font-medium">
                              {condition.type}
                            </span>
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
                              condition.status === "True" ? "bg-green-500" : ""
                            }
                          >
                            {condition.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Terminal Dialog */}
      <PodTerminalDialog
        isOpen={terminalDialogOpen}
        onClose={() => setTerminalDialogOpen(false)}
        pod={selectedPod}
      />

      {/* Logs Dialog */}
      <PodLogsDialog
        isOpen={logsDialogOpen}
        onClose={() => setLogsDialogOpen(false)}
        pod={selectedPod}
      />
    </div>
  );
}
