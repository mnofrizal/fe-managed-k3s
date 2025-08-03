"use client";

import { useState, useEffect, useRef } from "react";
import { Beaker } from "lucide-react";
import DeploymentForm from "@/components/playground/DeploymentForm";
import YamlPreview from "@/components/playground/YamlPreview";
import DeploymentMonitor from "@/components/playground/DeploymentMonitor";

export default function PlaygroundPage() {
  // Deployment creation states
  const [deploymentConfig, setDeploymentConfig] = useState({
    name: "",
    namespace: "default",
    image: "nginx:latest",
    cpu: "100m",
    memory: "128Mi",
    cpuLimit: "200m",
    memoryLimit: "256Mi",
    replicas: 1,
    envVars: [],
    ports: [{ containerPort: 80, protocol: "TCP" }],
    labels: { app: "" },
    pvcEnabled: false,
    pvcName: "",
    pvcSize: "250Mi",
    pvcMountPath: "/data",
    pvcStorageClass: "default",
    serviceEnabled: false,
    serviceName: "",
    serviceType: "ClusterIP",
    servicePort: 80,
    serviceTargetPort: 80,
    ingressEnabled: false,
    ingressName: "",
    ingressHost: "",
    ingressPath: "/",
    ingressClassName: "traefik",
  });

  // Monitoring states
  const [createdDeployments, setCreatedDeployments] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [deploymentLogs, setDeploymentLogs] = useState({});

  // Auto-refresh
  const intervalRef = useRef(null);

  // Predefined deployment templates
  const templates = {
    n8n: {
      name: "test-n8n",
      image: "n8nio/n8n:latest",
      cpu: "500m",
      memory: "512Mi",
      cpuLimit: "1000m",
      memoryLimit: "1Gi",
      ports: [{ containerPort: 5678, protocol: "TCP" }],
      envVars: [
        { name: "N8N_HOST", value: "0.0.0.0" },
        { name: "N8N_PORT", value: "5678" },
        { name: "N8N_PROTOCOL", value: "http" },
      ],
      pvcEnabled: true,
      pvcName: "n8n-data",
      pvcSize: "250Mi",
      pvcMountPath: "/home/node/.n8n",
      pvcStorageClass: "default",
      serviceEnabled: true,
      serviceName: "n8n-service",
      serviceType: "ClusterIP",
      servicePort: 5678,
      serviceTargetPort: 5678,
      ingressEnabled: true,
      ingressName: "n8n-ingress",
      ingressHost: "n8n.local",
      ingressPath: "/",
      ingressClassName: "traefik",
    },
    waha: {
      name: "test-waha",
      image: "devlikeapro/waha:latest",
      cpu: "300m",
      memory: "256Mi",
      cpuLimit: "500m",
      memoryLimit: "512Mi",
      ports: [{ containerPort: 3000, protocol: "TCP" }],
      envVars: [
        { name: "WAHA_PRINT_QR", value: "true" },
        { name: "WAHA_LOG_LEVEL", value: "info" },
      ],
      pvcEnabled: true,
      pvcName: "waha-sessions",
      pvcSize: "250Mi",
      pvcMountPath: "/app/sessions",
      pvcStorageClass: "default",
      serviceEnabled: true,
      serviceName: "waha-service",
      serviceType: "ClusterIP",
      servicePort: 3000,
      serviceTargetPort: 3000,
      ingressEnabled: true,
      ingressName: "waha-ingress",
      ingressHost: "waha.local",
      ingressPath: "/",
      ingressClassName: "traefik",
    },
    excalidraw: {
      name: "test-excalidraw",
      image: "excalidraw/excalidraw:latest",
      cpu: "200m",
      memory: "128Mi",
      cpuLimit: "400m",
      memoryLimit: "256Mi",
      ports: [{ containerPort: 80, protocol: "TCP" }],
      envVars: [],
      pvcEnabled: false,
      pvcName: "",
      pvcSize: "250Mi",
      pvcMountPath: "/data",
      pvcStorageClass: "default",
      serviceEnabled: true,
      serviceName: "excalidraw-service",
      serviceType: "ClusterIP",
      servicePort: 80,
      serviceTargetPort: 80,
      ingressEnabled: true,
      ingressName: "excalidraw-ingress",
      ingressHost: "excalidraw.local",
      ingressPath: "/",
      ingressClassName: "traefik",
    },
  };

  useEffect(() => {
    // Auto-refresh deployments every 3 seconds when monitoring is active
    if (monitoringActive) {
      intervalRef.current = setInterval(() => {
        refreshDeployments();
      }, 3000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [monitoringActive]);

  const createDeployment = async () => {
    setIsCreating(true);
    setCreateError(null);

    try {
      // Create deployment spec
      const deploymentSpec = {
        apiVersion: "apps/v1",
        kind: "Deployment",
        metadata: {
          name: deploymentConfig.name,
          labels: {
            ...deploymentConfig.labels,
            "playground-test": "true",
            "created-by": "k3s-playground",
          },
        },
        spec: {
          replicas: deploymentConfig.replicas,
          selector: {
            matchLabels: {
              app: deploymentConfig.labels.app || deploymentConfig.name,
            },
          },
          template: {
            metadata: {
              labels: {
                app: deploymentConfig.labels.app || deploymentConfig.name,
                "playground-test": "true",
                "created-by": "k3s-playground",
              },
            },
            spec: {
              containers: [
                {
                  name: deploymentConfig.name,
                  image: deploymentConfig.image,
                  ports: deploymentConfig.ports,
                  env: deploymentConfig.envVars,
                  resources: {
                    requests: {
                      cpu: deploymentConfig.cpu,
                      memory: deploymentConfig.memory,
                    },
                    limits: {
                      cpu: deploymentConfig.cpuLimit,
                      memory: deploymentConfig.memoryLimit,
                    },
                  },
                  ...(deploymentConfig.pvcEnabled && {
                    volumeMounts: [
                      {
                        name: "storage",
                        mountPath: deploymentConfig.pvcMountPath,
                      },
                    ],
                  }),
                },
              ],
              ...(deploymentConfig.pvcEnabled && {
                volumes: [
                  {
                    name: "storage",
                    persistentVolumeClaim: {
                      claimName: deploymentConfig.pvcName,
                    },
                  },
                ],
              }),
            },
          },
        },
      };

      // Build request payload
      const payload = {
        deployment: deploymentSpec,
      };

      // Add service spec if enabled
      if (deploymentConfig.serviceEnabled && deploymentConfig.serviceName) {
        payload.service = {
          apiVersion: "v1",
          kind: "Service",
          metadata: {
            name: deploymentConfig.serviceName,
          },
          spec: {
            type: deploymentConfig.serviceType,
            selector: {
              app: deploymentConfig.labels.app || deploymentConfig.name,
            },
            ports: [
              {
                protocol: "TCP",
                port: deploymentConfig.servicePort,
                targetPort: deploymentConfig.serviceTargetPort,
              },
            ],
          },
        };
      }

      // Add ingress spec if enabled
      if (
        deploymentConfig.ingressEnabled &&
        deploymentConfig.ingressName &&
        deploymentConfig.serviceEnabled
      ) {
        payload.ingress = {
          apiVersion: "networking.k8s.io/v1",
          kind: "Ingress",
          metadata: {
            name: deploymentConfig.ingressName,
          },
          spec: {
            ingressClassName: deploymentConfig.ingressClassName,
            rules: [
              {
                host: deploymentConfig.ingressHost,
                http: {
                  paths: [
                    {
                      path: deploymentConfig.ingressPath,
                      pathType: "Prefix",
                      backend: {
                        service: {
                          name: deploymentConfig.serviceName,
                          port: {
                            number: deploymentConfig.servicePort,
                          },
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        };
      }

      // Call unified deployment creation API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/deployments?namespace=${deploymentConfig.namespace}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create deployment");
      }

      // Add to monitoring list
      const newDeployment = {
        metadata: {
          name: deploymentConfig.name,
          namespace: deploymentConfig.namespace,
          creationTimestamp: new Date().toISOString(),
          labels: deploymentSpec.metadata.labels,
        },
        spec: deploymentSpec.spec,
        status: {
          replicas: deploymentConfig.replicas,
          readyReplicas: 0,
          availableReplicas: 0,
          conditions: [
            {
              type: "Progressing",
              status: "True",
              reason: "NewReplicaSetCreated",
            },
          ],
        },
      };

      setCreatedDeployments((prev) => [...prev, newDeployment]);
      setMonitoringActive(true);

      // Reset form
      setDeploymentConfig((prev) => ({
        ...prev,
        name: "",
        labels: { app: "" },
      }));
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const refreshDeployments = async () => {
    // In real implementation, fetch actual deployment status
    // For demo, simulate status changes
    setCreatedDeployments((prev) =>
      prev.map((deployment) => {
        const age =
          Date.now() -
          new Date(deployment.metadata.creationTimestamp).getTime();
        const ageMinutes = age / (1000 * 60);

        let newStatus = { ...deployment.status };

        // Simulate deployment lifecycle
        if (ageMinutes < 0.5) {
          newStatus.readyReplicas = 0;
          newStatus.availableReplicas = 0;
          newStatus.conditions = [
            {
              type: "Progressing",
              status: "True",
              reason: "ReplicaSetUpdated",
            },
          ];
        } else if (ageMinutes < 1) {
          newStatus.readyReplicas = Math.floor(deployment.spec.replicas / 2);
          newStatus.availableReplicas = Math.floor(
            deployment.spec.replicas / 2
          );
          newStatus.conditions = [
            {
              type: "Progressing",
              status: "True",
              reason: "ReplicaSetUpdated",
            },
          ];
        } else {
          newStatus.readyReplicas = deployment.spec.replicas;
          newStatus.availableReplicas = deployment.spec.replicas;
          newStatus.conditions = [
            {
              type: "Available",
              status: "True",
              reason: "MinimumReplicasAvailable",
            },
            {
              type: "Progressing",
              status: "True",
              reason: "NewReplicaSetAvailable",
            },
          ];
        }

        return { ...deployment, status: newStatus };
      })
    );
  };

  const deleteDeployment = async (deploymentName, namespace) => {
    try {
      // In real implementation, call delete API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/deployments/${deploymentName}?namespace=${namespace}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete deployment");
      }

      setCreatedDeployments((prev) =>
        prev.filter(
          (deployment) =>
            !(
              deployment.metadata.name === deploymentName &&
              deployment.metadata.namespace === namespace
            )
        )
      );
    } catch (err) {
      console.error("Failed to delete deployment:", err);
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Beaker className="h-8 w-8 text-blue-500" />
        <div>
          <h1 className="text-3xl font-bold">K3s Playground</h1>
          <p className="text-muted-foreground">
            Test deployment creation, monitor status flow, and experiment with
            Kubernetes workloads
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deployment Creation Form */}
        <DeploymentForm
          deploymentConfig={deploymentConfig}
          setDeploymentConfig={setDeploymentConfig}
          isCreating={isCreating}
          createError={createError}
          onCreateDeployment={createDeployment}
          templates={templates}
        />

        {/* YAML Config Preview */}
        <YamlPreview deploymentConfig={deploymentConfig} />
      </div>

      {/* Deployment Status Monitor - Full Width Below */}
      <DeploymentMonitor
        createdDeployments={createdDeployments}
        monitoringActive={monitoringActive}
        setMonitoringActive={setMonitoringActive}
        onRefreshDeployments={refreshDeployments}
        onDeleteDeployment={deleteDeployment}
      />
    </div>
  );
}
