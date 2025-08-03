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
  Server,
  Cpu,
  MemoryStick,
  Container,
  Activity,
  RefreshCw,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ClustersPage() {
  const [clusters, setClusters] = useState([]);
  const [clusterDetail, setClusterDetail] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clustersResponse, healthResponse] = await Promise.all([
        fetch("http://localhost:4600/api/clusters"),
        fetch("http://localhost:4600/api/health"),
      ]);

      if (!clustersResponse.ok) {
        throw new Error("Failed to fetch clusters");
      }
      if (!healthResponse.ok) {
        throw new Error("Failed to fetch health status");
      }

      const clustersData = await clustersResponse.json();
      const healthData = await healthResponse.json();

      setClusters(clustersData.data || []);
      setHealth(healthData);

      // Fetch detail for first cluster if available
      if (clustersData.data && clustersData.data.length > 0) {
        fetchClusterDetail(clustersData.data[0].name);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClusterDetail = async (clusterName) => {
    setDetailLoading(true);
    try {
      const response = await fetch(
        `http://localhost:4600/api/clusters/${clusterName}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch cluster details");
      }
      const data = await response.json();
      setClusterDetail(data.data);
    } catch (err) {
      console.error("Error fetching cluster details:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const getClusterStatus = (cluster) => {
    if (!health || !health.kubernetes) {
      return "Unknown";
    }

    // Check if this cluster is the current connected one
    if (cluster.isCurrent && health.kubernetes.connected) {
      return "Connected";
    } else if (
      cluster.context === health.kubernetes.context &&
      health.kubernetes.connected
    ) {
      return "Connected";
    } else {
      return "Disconnected";
    }
  };

  const getStatusBadge = (cluster) => {
    const status = getClusterStatus(cluster);

    switch (status.toLowerCase()) {
      case "connected":
        return <Badge className="bg-green-500">Connected</Badge>;
      case "disconnected":
        return <Badge variant="destructive">Disconnected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getKubernetesVersion = (versionObj) => {
    if (typeof versionObj === "string") {
      return versionObj;
    }
    if (typeof versionObj === "object" && versionObj) {
      return (
        versionObj.gitVersion ||
        versionObj.major + "." + versionObj.minor ||
        "-"
      );
    }
    return "-";
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>K3s Clusters</CardTitle>
            <CardDescription>Loading clusters...</CardDescription>
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
          <AlertDescription>Failed to load clusters: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const renderStatsCards = () => {
    if (!clusterDetail || !clusterDetail.metrics) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-8 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    const { usage, capacity } = clusterDetail.metrics;
    const { stats } = clusterDetail;

    const cpuUsagePercent = Math.round(
      (usage.cpu.millicores / capacity.cpu.millicores) * 100
    );
    const memoryUsagePercent = Math.round(
      (usage.memory.bytes / capacity.memory.bytes) * 100
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {/* CPU Usage Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  CPU Usage
                </p>
                <p className="text-2xl font-bold">{cpuUsagePercent}%</p>
                <p className="text-xs text-muted-foreground">
                  {usage.cpu.cores.toFixed(2)} / {capacity.cpu.cores} cores
                </p>
              </div>
              <Cpu className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={cpuUsagePercent} className="mt-3" />
          </CardContent>
        </Card>

        {/* Memory Usage Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Memory Usage
                </p>
                <p className="text-2xl font-bold">{memoryUsagePercent}%</p>
                <p className="text-xs text-muted-foreground">
                  {usage.memory.gigabytes.toFixed(1)} /{" "}
                  {capacity.memory.gigabytes.toFixed(1)} GB
                </p>
              </div>
              <MemoryStick className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={memoryUsagePercent} className="mt-3" />
          </CardContent>
        </Card>

        {/* Pods Total Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Pods
                </p>
                <p className="text-2xl font-bold">{stats.totalPods}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.runningPods} running, {stats.pendingPods} pending
                </p>
              </div>
              <Container className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Running: {stats.runningPods}</span>
                <span>Failed: {stats.failedPods}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nodes Total Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Nodes
                </p>
                <p className="text-2xl font-bold">{stats.totalNodes}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.readyNodes} ready
                </p>
              </div>
              <Activity className="h-8 w-8 text-orange-500" />
            </div>
            <div className="mt-3">
              <Progress
                value={(stats.readyNodes / stats.totalNodes) * 100}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>K3s Clusters</CardTitle>
              <CardDescription>
                Manage and monitor your K3s cluster deployments
              </CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>{clusters.length} clusters found</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Kubernetes Version</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clusters.map((cluster) => (
                  <TableRow key={cluster.id || cluster.name}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <Server className="h-4 w-4" />
                        <span>{cluster.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{cluster.origin || "-"}</TableCell>
                    <TableCell>{getStatusBadge(cluster)}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {getKubernetesVersion(
                        cluster.kubernetesVersion || cluster.version
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Cluster Details Section */}
      {clusters.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              Cluster Details - {clusters[0]?.name || "Loading..."}
            </CardTitle>
            <CardDescription>
              Resource usage and statistics for the selected cluster
            </CardDescription>
          </CardHeader>
          <CardContent>
            {detailLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-8 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              renderStatsCards()
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
