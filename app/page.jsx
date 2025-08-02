import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Server, Container, Cpu, ArrowRight } from "lucide-react";

export default function Home() {
  const features = [
    {
      title: "Clusters",
      description: "Manage and monitor your K3s cluster deployments",
      href: "/clusters",
      icon: Server,
      stats: "3 Active Clusters"
    },
    {
      title: "Nodes", 
      description: "View cluster nodes and their resource utilization",
      href: "/nodes",
      icon: Cpu,
      stats: "7 Running Nodes"
    },
    {
      title: "Pods",
      description: "Monitor running pods and workloads across namespaces", 
      href: "/pods",
      icon: Container,
      stats: "45 Active Pods"
    }
  ];

  return (
    <div className="container mx-auto py-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          K3s Management Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Comprehensive management and monitoring for your K3s Kubernetes clusters. 
          View cluster health, manage nodes, and monitor workloads from a single dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {features.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <Card key={feature.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <IconComponent className="h-6 w-6" />
                  <CardTitle>{feature.title}</CardTitle>
                </div>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {feature.stats}
                  </span>
                  <Button asChild variant="outline" size="sm">
                    <Link href={feature.href} className="flex items-center space-x-1">
                      <span>View</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common management tasks for your K3s infrastructure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="justify-start">
              Deploy Application
            </Button>
            <Button variant="outline" className="justify-start">
              Scale Workload
            </Button>
            <Button variant="outline" className="justify-start">
              View Logs
            </Button>
            <Button variant="outline" className="justify-start">
              Resource Usage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
