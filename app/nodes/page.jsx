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
import { AlertCircle, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function NodesPage() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNodes();
  }, []);

  const fetchNodes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:4000/api/nodes");
      if (!response.ok) {
        throw new Error("Failed to fetch nodes");
      }
      const data = await response.json();
      setNodes(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatAge = (timestamp) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now - created;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    }
    return `${diffHours}h`;
  };

  const formatCPU = (cpu) => {
    return `${cpu} cores`;
  };

  const formatMemory = (memoryKi) => {
    const memoryGB = Math.round(parseInt(memoryKi) / (1024 * 1024));
    return `${memoryGB} GB`;
  };

  const formatMemoryBytes = (bytes) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  const getInternalIP = (addresses) => {
    const internalIP = addresses?.find((addr) => addr.type === "InternalIP");
    return internalIP?.address || "-";
  };

  const getExternalIP = (addresses) => {
    const externalIP = addresses?.find((addr) => addr.type === "ExternalIP");
    return externalIP?.address || "-";
  };

  const getRoles = (roles) => {
    if (!roles || roles.length === 0) return "agent";

    // Clean up role names by removing node-role.kubernetes.io/ prefix
    const cleanRoles = roles.map((role) =>
      role.replace("node-role.kubernetes.io/", "")
    );

    return cleanRoles.join(", ");
  };

  const getCPUUsage = (node) => {
    if (!node.metrics?.usage?.cpu) return { percent: 0, raw: 0 };

    const cpuUsage = node.metrics.usage.cpu;
    const cpuCapacity = parseInt(node.capacity?.cpu || 0);

    if (cpuCapacity === 0) return { percent: 0, raw: 0 };

    // Use millicores directly for percentage calculation
    const usagePercent = Math.round(
      (cpuUsage.millicores / (cpuCapacity * 1000)) * 100
    );
    return { percent: usagePercent, raw: cpuUsage.millicores };
  };

  const getMemoryUsage = (node) => {
    if (!node.metrics?.usage?.memory) return { percent: 0, raw: 0 };

    const memoryUsage = node.metrics.usage.memory.bytes;
    const memoryCapacity = parseInt(node.capacity?.memory || 0) * 1024; // Convert Ki to bytes

    if (memoryCapacity === 0) return { percent: 0, raw: 0 };

    const usagePercent = Math.round((memoryUsage / memoryCapacity) * 100);
    return { percent: usagePercent, raw: memoryUsage };
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>K3s Nodes</CardTitle>
            <CardDescription>Loading cluster nodes...</CardDescription>
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
          <AlertDescription>Failed to load nodes: {error}</AlertDescription>
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
              <CardTitle>K3s Nodes</CardTitle>
              <CardDescription>
                Manage and monitor your K3s cluster nodes
              </CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={fetchNodes}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>
                {nodes.length} nodes found in the cluster
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>CPU</TableHead>
                  <TableHead>Memory</TableHead>
                  <TableHead>Pods</TableHead>
                  <TableHead>Ready</TableHead>
                  <TableHead>Taints</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Internal IP</TableHead>
                  <TableHead>External IP</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nodes.map((node) => {
                  const cpuUsage = getCPUUsage(node);
                  const memoryUsage = getMemoryUsage(node);

                  return (
                    <TableRow key={node.name}>
                      <TableCell className="font-medium">{node.name}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="space-y-1 ">
                                <div className="text-sm">
                                  {formatCPU(node.capacity?.cpu)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {cpuUsage.raw}m used ({cpuUsage.percent}%)
                                </div>
                                <Progress
                                  value={cpuUsage.percent}
                                  className="h-1"
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-sm">
                                <div>
                                  CPU Usage: {cpuUsage.raw}m of{" "}
                                  {node.capacity?.cpu * 1000}m
                                </div>
                                <div>({node.capacity?.cpu} cores)</div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="space-y-1 ">
                                <div className="text-sm">
                                  {formatMemory(node.capacity?.memory)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatMemoryBytes(memoryUsage.raw)} used (
                                  {memoryUsage.percent}%)
                                </div>
                                <Progress
                                  value={memoryUsage.percent}
                                  className="h-1"
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-sm">
                                <div>
                                  Memory Usage:{" "}
                                  {formatMemoryBytes(memoryUsage.raw)} of{" "}
                                  {formatMemory(node.capacity?.memory)}
                                </div>
                                <div>
                                  (
                                  {Math.round(
                                    parseInt(node.capacity?.memory) /
                                      (1024 * 1024)
                                  )}{" "}
                                  GB total)
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="space-y-1">
                                <div className="text-sm">
                                  {node.pods?.total || 0}/{node.capacity?.pods || 110}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {node.pods?.running || 0} running, {node.pods?.pending || 0} pending
                                </div>
                                <Progress
                                  value={((node.pods?.total || 0) / (node.capacity?.pods || 110)) * 100}
                                  className="h-1"
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-sm">
                                <div>Running: {node.pods?.running || 0}</div>
                                <div>Pending: {node.pods?.pending || 0}</div>
                                <div>Failed: {node.pods?.failed || 0}</div>
                                <div>Succeeded: {node.pods?.succeeded || 0}</div>
                                <div>Total: {node.pods?.total || 0} of {node.capacity?.pods || 110}</div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            node.status === "True" ? "default" : "destructive"
                          }
                          className={
                            node.status === "True" ? "bg-green-500" : ""
                          }
                        >
                          {node.status === "True" ? "Ready" : "Not Ready"}
                        </Badge>
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>{getRoles(node.roles)}</TableCell>
                      <TableCell>{getInternalIP(node.addresses)}</TableCell>
                      <TableCell>{getExternalIP(node.addresses)}</TableCell>
                      <TableCell>{node.kubeletVersion}</TableCell>
                      <TableCell>{formatAge(node.creationTimestamp)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            Edit
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
    </div>
  );
}
