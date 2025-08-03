"use client";

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Trash2,
  RefreshCw,
  AlertCircle,
  Container,
  HardDrive,
  Globe,
  Router,
} from "lucide-react";

export default function DeploymentForm({ 
  deploymentConfig, 
  setDeploymentConfig, 
  isCreating, 
  createError, 
  onCreateDeployment,
  templates 
}) {
  const loadTemplate = (templateName) => {
    const template = templates[templateName];
    if (template) {
      setDeploymentConfig({
        ...deploymentConfig,
        ...template,
        namespace: deploymentConfig.namespace,
        replicas: deploymentConfig.replicas,
        labels: { app: template.name },
      });
    }
  };

  const addEnvVar = () => {
    setDeploymentConfig((prev) => ({
      ...prev,
      envVars: [...prev.envVars, { name: "", value: "" }],
    }));
  };

  const updateEnvVar = (index, field, value) => {
    setDeploymentConfig((prev) => ({
      ...prev,
      envVars: prev.envVars.map((env, i) =>
        i === index ? { ...env, [field]: value } : env
      ),
    }));
  };

  const removeEnvVar = (index) => {
    setDeploymentConfig((prev) => ({
      ...prev,
      envVars: prev.envVars.filter((_, i) => i !== index),
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Container className="h-5 w-5" />
          Create Test Deployment
        </CardTitle>
        <CardDescription>
          Configure and deploy deployments for testing and monitoring
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Templates */}
        <div>
          <Label>Quick Templates</Label>
          <div className="flex gap-2 mt-2">
            {Object.keys(templates).map((template) => (
              <Button
                key={template}
                variant="outline"
                size="sm"
                onClick={() => loadTemplate(template)}
              >
                {template}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Basic Config */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Deployment Name</Label>
            <Input
              id="name"
              value={deploymentConfig.name}
              onChange={(e) =>
                setDeploymentConfig((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="my-test-deployment"
            />
          </div>
          <div>
            <Label htmlFor="namespace">Namespace</Label>
            <Select
              value={deploymentConfig.namespace}
              onValueChange={(value) =>
                setDeploymentConfig((prev) => ({ ...prev, namespace: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">default</SelectItem>
                <SelectItem value="kube-system">kube-system</SelectItem>
                <SelectItem value="playground">playground</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="image">Container Image</Label>
          <Input
            id="image"
            value={deploymentConfig.image}
            onChange={(e) =>
              setDeploymentConfig((prev) => ({ ...prev, image: e.target.value }))
            }
            placeholder="nginx:latest"
          />
        </div>

        {/* Replicas */}
        <div>
          <Label htmlFor="replicas">Replicas</Label>
          <Input
            id="replicas"
            type="number"
            min="1"
            max="10"
            value={deploymentConfig.replicas}
            onChange={(e) =>
              setDeploymentConfig((prev) => ({ ...prev, replicas: parseInt(e.target.value) || 1 }))
            }
            placeholder="1"
          />
        </div>

        {/* Resources */}
        <div>
          <Label className="text-sm font-medium">Resource Configuration</Label>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <Label htmlFor="cpu" className="text-xs text-muted-foreground">CPU Request</Label>
              <Input
                id="cpu"
                value={deploymentConfig.cpu}
                onChange={(e) =>
                  setDeploymentConfig((prev) => ({ ...prev, cpu: e.target.value }))
                }
                placeholder="100m"
              />
            </div>
            <div>
              <Label htmlFor="cpuLimit" className="text-xs text-muted-foreground">CPU Limit</Label>
              <Input
                id="cpuLimit"
                value={deploymentConfig.cpuLimit}
                onChange={(e) =>
                  setDeploymentConfig((prev) => ({ ...prev, cpuLimit: e.target.value }))
                }
                placeholder="200m"
              />
            </div>
            <div>
              <Label htmlFor="memory" className="text-xs text-muted-foreground">Memory Request</Label>
              <Input
                id="memory"
                value={deploymentConfig.memory}
                onChange={(e) =>
                  setDeploymentConfig((prev) => ({
                    ...prev,
                    memory: e.target.value,
                  }))
                }
                placeholder="128Mi"
              />
            </div>
            <div>
              <Label htmlFor="memoryLimit" className="text-xs text-muted-foreground">Memory Limit</Label>
              <Input
                id="memoryLimit"
                value={deploymentConfig.memoryLimit}
                onChange={(e) =>
                  setDeploymentConfig((prev) => ({
                    ...prev,
                    memoryLimit: e.target.value,
                  }))
                }
                placeholder="256Mi"
              />
            </div>
          </div>
        </div>

        {/* Environment Variables */}
        <div>
          <div className="flex items-center justify-between">
            <Label>Environment Variables</Label>
            <Button variant="outline" size="sm" onClick={addEnvVar}>
              Add Env Var
            </Button>
          </div>
          <div className="space-y-2 mt-2">
            {deploymentConfig.envVars.map((env, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Name"
                  value={env.name}
                  onChange={(e) =>
                    updateEnvVar(index, "name", e.target.value)
                  }
                />
                <Input
                  placeholder="Value"
                  value={env.value}
                  onChange={(e) =>
                    updateEnvVar(index, "value", e.target.value)
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeEnvVar(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Labels */}
        <div>
          <Label htmlFor="app-label">App Label</Label>
          <Input
            id="app-label"
            value={deploymentConfig.labels.app}
            onChange={(e) =>
              setDeploymentConfig((prev) => ({
                ...prev,
                labels: { ...prev.labels, app: e.target.value },
              }))
            }
            placeholder="my-app"
          />
        </div>

        <Separator />

        {/* PVC Configuration */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4" />
              <Label htmlFor="pvc-toggle" className="text-sm font-medium">
                Persistent Volume Claim (PVC)
              </Label>
            </div>
            <Switch
              id="pvc-toggle"
              checked={deploymentConfig.pvcEnabled}
              onCheckedChange={(checked) =>
                setDeploymentConfig((prev) => ({ ...prev, pvcEnabled: checked }))
              }
            />
          </div>
          
          {deploymentConfig.pvcEnabled && (
            <div className="grid grid-cols-1 gap-4 mt-4 p-4 border rounded-lg bg-muted/20">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pvc-name" className="text-xs text-muted-foreground">
                    PVC Name
                  </Label>
                  <Input
                    id="pvc-name"
                    value={deploymentConfig.pvcName}
                    onChange={(e) =>
                      setDeploymentConfig((prev) => ({ ...prev, pvcName: e.target.value }))
                    }
                    placeholder="my-pvc"
                  />
                </div>
                <div>
                  <Label htmlFor="pvc-size" className="text-xs text-muted-foreground">
                    Storage Size
                  </Label>
                  <Input
                    id="pvc-size"
                    value={deploymentConfig.pvcSize}
                    onChange={(e) =>
                      setDeploymentConfig((prev) => ({ ...prev, pvcSize: e.target.value }))
                    }
                    placeholder="250Mi"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pvc-mount-path" className="text-xs text-muted-foreground">
                    Mount Path
                  </Label>
                  <Input
                    id="pvc-mount-path"
                    value={deploymentConfig.pvcMountPath}
                    onChange={(e) =>
                      setDeploymentConfig((prev) => ({ ...prev, pvcMountPath: e.target.value }))
                    }
                    placeholder="/data"
                  />
                </div>
                <div>
                  <Label htmlFor="pvc-storage-class" className="text-xs text-muted-foreground">
                    Storage Class
                  </Label>
                  <Select
                    value={deploymentConfig.pvcStorageClass}
                    onValueChange={(value) =>
                      setDeploymentConfig((prev) => ({ ...prev, pvcStorageClass: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">default</SelectItem>
                      <SelectItem value="fast">fast</SelectItem>
                      <SelectItem value="slow">slow</SelectItem>
                      <SelectItem value="local-path">local-path</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Service Configuration */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Router className="h-4 w-4" />
              <Label htmlFor="service-toggle" className="text-sm font-medium">
                Create Service
              </Label>
            </div>
            <Switch
              id="service-toggle"
              checked={deploymentConfig.serviceEnabled}
              onCheckedChange={(checked) =>
                setDeploymentConfig((prev) => ({ ...prev, serviceEnabled: checked }))
              }
            />
          </div>
          
          {deploymentConfig.serviceEnabled && (
            <div className="grid grid-cols-1 gap-4 mt-4 p-4 border rounded-lg bg-muted/20">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service-name" className="text-xs text-muted-foreground">
                    Service Name
                  </Label>
                  <Input
                    id="service-name"
                    value={deploymentConfig.serviceName}
                    onChange={(e) =>
                      setDeploymentConfig((prev) => ({ ...prev, serviceName: e.target.value }))
                    }
                    placeholder="my-service"
                  />
                </div>
                <div>
                  <Label htmlFor="service-type" className="text-xs text-muted-foreground">
                    Service Type
                  </Label>
                  <Select
                    value={deploymentConfig.serviceType}
                    onValueChange={(value) =>
                      setDeploymentConfig((prev) => ({ ...prev, serviceType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ClusterIP">ClusterIP</SelectItem>
                      <SelectItem value="NodePort">NodePort</SelectItem>
                      <SelectItem value="LoadBalancer">LoadBalancer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service-port" className="text-xs text-muted-foreground">
                    Service Port
                  </Label>
                  <Input
                    id="service-port"
                    type="number"
                    value={deploymentConfig.servicePort}
                    onChange={(e) =>
                      setDeploymentConfig((prev) => ({ ...prev, servicePort: parseInt(e.target.value) || 80 }))
                    }
                    placeholder="80"
                  />
                </div>
                <div>
                  <Label htmlFor="service-target-port" className="text-xs text-muted-foreground">
                    Target Port
                  </Label>
                  <Input
                    id="service-target-port"
                    type="number"
                    value={deploymentConfig.serviceTargetPort}
                    onChange={(e) =>
                      setDeploymentConfig((prev) => ({ ...prev, serviceTargetPort: parseInt(e.target.value) || 80 }))
                    }
                    placeholder="80"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Ingress Configuration */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <Label htmlFor="ingress-toggle" className="text-sm font-medium">
                Create Ingress
              </Label>
            </div>
            <Switch
              id="ingress-toggle"
              checked={deploymentConfig.ingressEnabled}
              onCheckedChange={(checked) =>
                setDeploymentConfig((prev) => ({ ...prev, ingressEnabled: checked }))
              }
            />
          </div>
          
          {deploymentConfig.ingressEnabled && (
            <div className="grid grid-cols-1 gap-4 mt-4 p-4 border rounded-lg bg-muted/20">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ingress-name" className="text-xs text-muted-foreground">
                    Ingress Name
                  </Label>
                  <Input
                    id="ingress-name"
                    value={deploymentConfig.ingressName}
                    onChange={(e) =>
                      setDeploymentConfig((prev) => ({ ...prev, ingressName: e.target.value }))
                    }
                    placeholder="my-ingress"
                  />
                </div>
                <div>
                  <Label htmlFor="ingress-class" className="text-xs text-muted-foreground">
                    Ingress Class
                  </Label>
                  <Select
                    value={deploymentConfig.ingressClassName}
                    onValueChange={(value) =>
                      setDeploymentConfig((prev) => ({ ...prev, ingressClassName: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="traefik">traefik</SelectItem>
                      <SelectItem value="nginx">nginx</SelectItem>
                      <SelectItem value="haproxy">haproxy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ingress-host" className="text-xs text-muted-foreground">
                    Host
                  </Label>
                  <Input
                    id="ingress-host"
                    value={deploymentConfig.ingressHost}
                    onChange={(e) =>
                      setDeploymentConfig((prev) => ({ ...prev, ingressHost: e.target.value }))
                    }
                    placeholder="app.local"
                  />
                </div>
                <div>
                  <Label htmlFor="ingress-path" className="text-xs text-muted-foreground">
                    Path
                  </Label>
                  <Input
                    id="ingress-path"
                    value={deploymentConfig.ingressPath}
                    onChange={(e) =>
                      setDeploymentConfig((prev) => ({ ...prev, ingressPath: e.target.value }))
                    }
                    placeholder="/"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {createError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{createError}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={onCreateDeployment}
          disabled={isCreating || !deploymentConfig.name || !deploymentConfig.image}
          className="w-full"
        >
          {isCreating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Creating Deployment...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Create Deployment
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}