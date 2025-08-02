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
import { AlertCircle, FolderOpen, RefreshCw, Container, CheckCircle, XCircle, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function NamespacesPage() {
  const [namespaces, setNamespaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNamespace, setSelectedNamespace] = useState(null);
  const [namespacePods, setNamespacePods] = useState([]);
  const [podsLoading, setPodsLoading] = useState(false);
  const [podsError, setPodsError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchNamespaces();
  }, []);

  const fetchNamespaces = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:4000/api/namespaces");
      if (!response.ok) {
        throw new Error("Failed to fetch namespaces");
      }
      const data = await response.json();
      setNamespaces(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchNamespacePods = async (namespace) => {
    setPodsLoading(true);
    setPodsError(null);
    try {
      const response = await fetch(`http://localhost:4000/api/pods?namespace=${namespace}`);
      if (!response.ok) {
        throw new Error("Failed to fetch pods");
      }
      const data = await response.json();
      setNamespacePods(data.data || []);
    } catch (err) {
      setPodsError(err.message);
    } finally {
      setPodsLoading(false);
    }
  };

  const handleViewPods = (namespace) => {
    setSelectedNamespace(namespace);
    setDialogOpen(true);
    fetchNamespacePods(namespace);
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "terminating":
        return <Badge variant="destructive">Terminating</Badge>;
      default:
        return <Badge variant="secondary">{status || "Unknown"}</Badge>;
    }
  };

  const formatAge = (timestamp) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now - created;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `${diffDays}d`;
    } else {
      return `${diffHours}h`;
    }
  };

  const getPodStatusBadge = (pod) => {
    const phase = pod.status?.phase;
    const ready = pod.status?.ready;
    
    // If pod is not ready, check for container reasons
    if (ready === false) {
      const containerWithReason = pod.containers?.find(container => 
        container.state?.waiting?.reason
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
    const readyContainers = pod.containers?.filter((c) => c.ready).length || 0;
    const totalContainers = pod.containers?.length || 0;
    const isReady = readyContainers === totalContainers && totalContainers > 0;
    
    return (
      <Badge variant={isReady ? "default" : "destructive"} className={isReady ? "bg-green-500" : ""}>
        {readyContainers}/{totalContainers}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Namespaces</CardTitle>
            <CardDescription>Loading namespaces...</CardDescription>
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
          <AlertDescription>Failed to load namespaces: {error}</AlertDescription>
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
              <CardTitle>Namespaces</CardTitle>
              <CardDescription>
                Manage and monitor Kubernetes namespaces in your cluster
              </CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={fetchNamespaces}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>
                {namespaces.length} namespaces found in the cluster
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Labels</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {namespaces.map((namespace) => (
                  <TableRow key={namespace.name}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <FolderOpen className="h-4 w-4" />
                        <span>{namespace.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(namespace.status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {namespace.labels && Object.keys(namespace.labels).length > 0 ? (
                          Object.entries(namespace.labels).slice(0, 2).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {value}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">No labels</span>
                        )}
                        {namespace.labels && Object.keys(namespace.labels).length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{Object.keys(namespace.labels).length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatAge(namespace.creationTimestamp)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewPods(namespace.name)}
                        >
                          View Pods
                        </Button>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600"
                          disabled={namespace.name === "default" || namespace.name === "kube-system"}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pods Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pods in {selectedNamespace} namespace</DialogTitle>
            <DialogDescription>
              View all pods running in the {selectedNamespace} namespace
            </DialogDescription>
          </DialogHeader>
          
          {podsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : podsError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Failed to load pods: {podsError}</AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>
                  {namespacePods.length} pods found in {selectedNamespace} namespace
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ready</TableHead>
                    <TableHead>Node</TableHead>
                    <TableHead>Age</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {namespacePods.map((pod) => (
                    <TableRow key={pod.name}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Container className="h-4 w-4" />
                          <span className="font-mono text-sm">{pod.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getPodStatusBadge(pod)}</TableCell>
                      <TableCell>{getPodReadyBadge(pod)}</TableCell>
                      <TableCell>{pod.spec?.nodeName || "-"}</TableCell>
                      <TableCell>{formatAge(pod.creationTimestamp)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}