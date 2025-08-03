"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Play, Square, RefreshCw, Download, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PodLogsDialog({ isOpen, onClose, pod }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState("");
  const [connectionError, setConnectionError] = useState(null);
  const [logs, setLogs] = useState("");
  
  const wsRef = useRef(null);
  const logsRef = useRef(null);

  const containerOptions = pod?.containers?.map(container => ({
    value: container.name,
    label: container.name
  })) || [];

  useEffect(() => {
    if (containerOptions.length > 0) {
      setSelectedContainer(containerOptions[0].value);
    }
  }, [containerOptions]);

  // Reset container selection when pod changes
  useEffect(() => {
    if (pod && containerOptions.length > 0) {
      setSelectedContainer(containerOptions[0].value);
    }
  }, [pod?.name, containerOptions]);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Clean up when dialog closes
  useEffect(() => {
    if (!isOpen) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      setIsConnecting(false);
      setLogs("");
      setConnectionError(null);
    }
  }, [isOpen]);

  const connectLogs = () => {
    if (!pod || !selectedContainer) return;

    setIsConnecting(true);
    setConnectionError(null);
    setLogs("");

    try {
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${wsProtocol}//localhost:4600/api/namespaces/${pod.namespace}/pods/${pod.name}/logs/stream?containerName=${selectedContainer}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setLogs("Streaming logs...\n");
        // Auto-scroll to bottom when connection opens
        setTimeout(() => {
          if (logsRef.current) {
            logsRef.current.scrollTop = logsRef.current.scrollHeight;
          }
        }, 0);
      };

      ws.onmessage = (event) => {
        // Handle both text and binary data
        let data = event.data;
        if (typeof data !== 'string') {
          data = new TextDecoder().decode(data);
        }
        
        // Strip ANSI escape sequences for cleaner log display
        const cleanData = data.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
        
        setLogs((prev) => {
          const newLogs = prev + cleanData;
          // Auto-scroll to bottom after state update
          setTimeout(() => {
            if (logsRef.current) {
              logsRef.current.scrollTop = logsRef.current.scrollHeight;
            }
          }, 0);
          return newLogs;
        });
      };

      ws.onerror = () => {
        setConnectionError("Failed to connect to log stream");
        setIsConnecting(false);
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        setLogs(prev => prev + "\nLog stream disconnected\n");
      };
    } catch (err) {
      setConnectionError(err.message);
      setIsConnecting(false);
      setIsConnected(false);
    }
  };

  const disconnectLogs = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  };

  const clearLogs = () => {
    setLogs("");
  };

  const downloadLogs = () => {
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pod?.name}-${selectedContainer}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    // Clean up when dialog closes
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setLogs("");
    setConnectionError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[60vw] w-[60vw] h-[85vh] flex flex-col sm:max-w-[60vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Logs - {pod?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Container:</label>
              <Select
                value={selectedContainer}
                onValueChange={setSelectedContainer}
                disabled={isConnected}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select container" />
                </SelectTrigger>
                <SelectContent>
                  {containerOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 ml-auto">
              {!isConnected ? (
                <Button
                  onClick={connectLogs}
                  disabled={isConnecting || !selectedContainer}
                  className="flex items-center gap-2"
                >
                  {isConnecting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {isConnecting ? "Connecting..." : "Start Streaming"}
                </Button>
              ) : (
                <Button
                  onClick={disconnectLogs}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  Stop Streaming
                </Button>
              )}

              <Button
                onClick={clearLogs}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={!logs}
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>

              <Button
                onClick={downloadLogs}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={!logs}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {connectionError && (
            <Alert variant="destructive">
              <AlertDescription>{connectionError}</AlertDescription>
            </Alert>
          )}

          {/* Logs Display */}
          <div className="border rounded-lg bg-gray-900 text-gray-100 font-mono text-sm">
            <div
              ref={logsRef}
              className="h-96 p-4 overflow-y-scroll whitespace-pre-wrap break-words"
              style={{ 
                height: "400px",
                scrollbarWidth: "thin",
                scrollbarColor: "#4a5568 #1a202c"
              }}
            >
              {logs || "No logs to display. Click 'Start Streaming' to begin watching logs."}
            </div>
          </div>

          {/* Log Stats */}
          {logs && (
            <div className="flex justify-between items-center text-sm text-muted-foreground p-2 border rounded-lg bg-muted/50">
              <span>Lines: {logs.split('\n').length - 1}</span>
              <span>Size: {new Blob([logs]).size} bytes</span>
              <span>Container: {selectedContainer}</span>
              <span className={`flex items-center gap-1 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                {isConnected ? 'Streaming' : 'Disconnected'}
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}