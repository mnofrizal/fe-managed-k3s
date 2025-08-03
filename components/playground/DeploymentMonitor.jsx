"use client";

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Container,
  Cpu,
  MemoryStick,
  Activity,
  Eye,
} from "lucide-react";

export default function DeploymentMonitor({ 
  createdDeployments, 
  monitoringActive, 
  setMonitoringActive, 
  onRefreshDeployments, 
  onDeleteDeployment 
}) {
  const getDeploymentStatusBadge = (deployment) => {
    const readyReplicas = deployment.status?.readyReplicas || 0;
    const totalReplicas = deployment.spec?.replicas || 0;
    const conditions = deployment.status?.conditions || [];
    
    const isAvailable = conditions.some(
      (c) => c.type === "Available" && c.status === "True"
    );
    const isProgressing = conditions.some(
      (c) => c.type === "Progressing" && c.status === "True"
    );

    if (readyReplicas === totalReplicas && isAvailable) {
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Ready ({readyReplicas}/{totalReplicas})
        </Badge>
      );
    } else if (isProgressing) {
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Progressing ({readyReplicas}/{totalReplicas})
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Failed ({readyReplicas}/{totalReplicas})
        </Badge>
      );
    }
  };

  const formatAge = (timestamp) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now - created;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffMinutes > 0) {
      return `${diffMinutes}m`;
    } else {
      return `${diffSeconds}s`;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Deployment Status Monitor
          <Badge
            variant={monitoringActive ? "default" : "secondary"}
            className="ml-auto"
          >
            {monitoringActive ? "Active" : "Inactive"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Real-time monitoring of created deployments and their lifecycle
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-muted-foreground">
            {createdDeployments.length} deployments being monitored
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMonitoringActive(!monitoringActive)}
            >
              <Eye className="h-4 w-4 mr-1" />
              {monitoringActive ? "Pause" : "Start"} Monitor
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefreshDeployments}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {createdDeployments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No deployments created yet. Create a deployment to start monitoring.
            </div>
          ) : (
            createdDeployments.map((deployment) => (
              <div
                key={`${deployment.metadata.namespace}/${deployment.metadata.name}`}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Container className="h-4 w-4" />
                    <span className="font-mono text-sm font-medium">
                      {deployment.metadata.name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {deployment.metadata.namespace}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getDeploymentStatusBadge(deployment)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onDeleteDeployment(deployment.metadata.name, deployment.metadata.namespace)
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      <Container className="h-3 w-3" />
                      <span className="text-muted-foreground">Image:</span>
                      <span className="font-mono">
                        {deployment.spec.template.spec.containers[0].image}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Cpu className="h-3 w-3" />
                      <span className="text-muted-foreground">CPU:</span>
                      <span>
                        {deployment.spec.template.spec.containers[0].resources?.requests?.cpu ||
                          "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MemoryStick className="h-3 w-3" />
                      <span className="text-muted-foreground">Memory:</span>
                      <span>
                        {deployment.spec.template.spec.containers[0].resources?.requests?.memory ||
                          "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <span className="text-muted-foreground">Replicas:</span>
                      <span className="ml-1">
                        {deployment.status?.readyReplicas || 0}/{deployment.spec?.replicas || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Available:</span>
                      <span className="ml-1">
                        {deployment.status?.availableReplicas || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Age:</span>
                      <span className="ml-1">
                        {formatAge(deployment.metadata.creationTimestamp)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deployment Conditions */}
                {deployment.status?.conditions && deployment.status.conditions.length > 0 && (
                  <div className="border-t pt-2">
                    <div className="text-xs text-muted-foreground">
                      Conditions:
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {deployment.status.conditions.map((condition, index) => (
                        <Badge 
                          key={index}
                          variant={condition.status === "True" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {condition.type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}