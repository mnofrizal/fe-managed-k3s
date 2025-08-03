"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Network,
  Globe,
  Router,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Clock,
  MapPin,
  Lock,
} from "lucide-react";

export default function NetworkPage() {
  const [services, setServices] = useState([]);
  const [ingresses, setIngresses] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [ingressesLoading, setIngressesLoading] = useState(true);
  const [servicesError, setServicesError] = useState(null);
  const [ingressesError, setIngressesError] = useState(null);
  const [activeTab, setActiveTab] = useState("services");

  useEffect(() => {
    fetchServices();
    fetchIngresses();
  }, []);

  const fetchServices = async () => {
    setServicesLoading(true);
    setServicesError(null);
    try {
      const response = await fetch("http://localhost:4600/api/services", {
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }
      
      const result = await response.json();
      setServices(result.success ? result.data : []);
    } catch (err) {
      setServicesError(err.message);
    } finally {
      setServicesLoading(false);
    }
  };

  const fetchIngresses = async () => {
    setIngressesLoading(true);
    setIngressesError(null);
    try {
      const response = await fetch("http://localhost:4600/api/ingresses", {
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch ingresses");
      }
      
      const result = await response.json();
      setIngresses(result.success ? result.data : []);
    } catch (err) {
      setIngressesError(err.message);
    } finally {
      setIngressesLoading(false);
    }
  };

  const refreshData = () => {
    if (activeTab === "services") {
      fetchServices();
    } else {
      fetchIngresses();
    }
  };

  const getServiceType = (service) => {
    const type = service.spec?.type || "ClusterIP";
    const colorMap = {
      ClusterIP: "bg-blue-500",
      NodePort: "bg-green-500",
      LoadBalancer: "bg-purple-500",
      ExternalName: "bg-orange-500",
    };
    return (
      <Badge className={`${colorMap[type]} text-white`}>
        {type}
      </Badge>
    );
  };

  const getServicePorts = (service) => {
    const ports = service.spec?.ports || [];
    if (ports.length === 0) return "None";
    
    return ports.map(port => {
      const targetPort = port.targetPort || port.port;
      return `${port.port}:${targetPort}/${port.protocol}`;
    }).join(", ");
  };

  const getIngressHosts = (ingress) => {
    const rules = ingress.spec?.rules || [];
    if (rules.length === 0) return "*";
    
    return rules.map(rule => rule.host || "*").join(", ");
  };

  const getIngressBackendServices = (ingress) => {
    const rules = ingress.spec?.rules || [];
    let services = [];
    
    rules.forEach(rule => {
      const httpPaths = rule.http?.paths || [];
      httpPaths.forEach(path => {
        const backend = path.backend?.service;
        if (backend) {
          const serviceName = backend.name;
          const port = backend.port?.number || backend.port?.name || "unknown";
          services.push(`${serviceName}:${port}`);
        }
      });
    });
    
    // Remove duplicates and return
    const uniqueServices = [...new Set(services)];
    return uniqueServices.length > 0 ? uniqueServices.join(", ") : "None";
  };

  const getIngressAddresses = (ingress) => {
    const ingressList = ingress.status?.loadBalancer?.ingress || [];
    if (ingressList.length === 0) return "Pending";
    
    const addresses = ingressList.map(ing => ing.ip || ing.hostname).filter(Boolean);
    return addresses.length > 0 ? addresses.join(", ") : "Pending";
  };

  const getIngressClass = (ingress) => {
    return ingress.spec?.ingressClassName || 
           ingress.metadata?.annotations?.["kubernetes.io/ingress.class"] || 
           "default";
  };

  const hasTLS = (ingress) => {
    return ingress.spec?.tls && ingress.spec.tls.length > 0;
  };

  const formatAge = (timestamp) => {
    if (!timestamp) return "Unknown";
    
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now - created;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    return `${diffMinutes}m`;
  };

  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Network className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold">Network</h1>
            <p className="text-muted-foreground">
              Manage services and ingresses for cluster networking
            </p>
          </div>
        </div>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Router className="h-4 w-4" />
            Services ({services.length})
          </TabsTrigger>
          <TabsTrigger value="ingresses" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Ingresses ({ingresses.length})
          </TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Router className="h-5 w-5" />
                Services
              </CardTitle>
              <CardDescription>
                Kubernetes services expose applications running on pods
              </CardDescription>
            </CardHeader>
            <CardContent>
              {servicesError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{servicesError}</AlertDescription>
                </Alert>
              )}
              
              {servicesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Loading services...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Namespace</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Cluster IP</TableHead>
                      <TableHead>External IP</TableHead>
                      <TableHead>Ports</TableHead>
                      <TableHead>Age</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No services found
                        </TableCell>
                      </TableRow>
                    ) : (
                      services.map((service) => (
                        <TableRow key={`${service.metadata?.namespace}/${service.metadata?.name}`}>
                          <TableCell className="font-medium">
                            {service.metadata?.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {service.metadata?.namespace}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getServiceType(service)}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {service.spec?.clusterIP || "None"}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {service.status?.loadBalancer?.ingress?.[0]?.ip || 
                             service.spec?.externalIPs?.join(", ") || 
                             (service.spec?.type === "NodePort" ? "nodes" : "None")}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {getServicePorts(service)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatAge(service.metadata?.creationTimestamp)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ingresses Tab */}
        <TabsContent value="ingresses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Ingresses
              </CardTitle>
              <CardDescription>
                Ingress controllers manage external access to services
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ingressesError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{ingressesError}</AlertDescription>
                </Alert>
              )}
              
              {ingressesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Loading ingresses...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Namespace</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Hosts</TableHead>
                      <TableHead>Backend Service</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>TLS</TableHead>
                      <TableHead>Age</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingresses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No ingresses found
                        </TableCell>
                      </TableRow>
                    ) : (
                      ingresses.map((ingress) => (
                        <TableRow key={`${ingress.metadata?.namespace}/${ingress.metadata?.name}`}>
                          <TableCell className="font-medium">
                            {ingress.metadata?.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {ingress.metadata?.namespace}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {getIngressClass(ingress)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {getIngressHosts(ingress)}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {getIngressBackendServices(ingress)}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {getIngressAddresses(ingress)}
                          </TableCell>
                          <TableCell>
                            {hasTLS(ingress) ? (
                              <Badge className="bg-green-500 text-white">
                                <Lock className="h-3 w-3 mr-1" />
                                TLS
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                No TLS
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatAge(ingress.metadata?.creationTimestamp)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}