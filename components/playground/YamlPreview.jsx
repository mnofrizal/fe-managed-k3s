"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function YamlPreview({ deploymentConfig }) {
  const generateYamlConfig = () => {
    const deploymentSpec = {
      apiVersion: "apps/v1",
      kind: "Deployment",
      metadata: {
        name: deploymentConfig.name || "my-test-deployment",
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
                name: deploymentConfig.name || "my-test-deployment",
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

    const payload = {
      deployment: deploymentSpec,
    };

    // Add service if enabled
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

    // Add ingress if enabled
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

    return JSON.stringify(payload, null, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generated API Payload
        </CardTitle>
        <CardDescription>
          Complete payload including deployment, service, and ingress specs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg bg-gray-900 text-gray-100 font-mono text-sm">
          <pre className="p-4 overflow-auto max-h-[100vh] whitespace-pre-wrap">
            {generateYamlConfig()}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
