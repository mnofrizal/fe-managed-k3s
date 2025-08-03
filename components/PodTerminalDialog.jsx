"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Terminal, Play, Square, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PodTerminalDialog({ isOpen, onClose, pod }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState("");
  const [selectedShell, setSelectedShell] = useState("/bin/sh");
  const [connectionError, setConnectionError] = useState(null);
  const [terminalOutput, setTerminalOutput] = useState("");

  const wsRef = useRef(null);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  const containerOptions =
    pod?.containers?.map((container) => ({
      value: container.name,
      label: container.name,
    })) || [];

  const shellOptions = [
    { value: "/bin/sh", label: "/bin/sh" },
    { value: "/bin/bash", label: "/bin/bash" },
    { value: "/bin/zsh", label: "/bin/zsh" },
  ];

  useEffect(() => {
    if (containerOptions.length > 0 && !selectedContainer) {
      setSelectedContainer(containerOptions[0].value);
    }
  }, [containerOptions, selectedContainer]);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectTerminal = () => {
    if (!pod || !selectedContainer) return;

    setIsConnecting(true);
    setConnectionError(null);
    setTerminalOutput("");

    try {
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${wsProtocol}//localhost:4600/api/namespaces/${pod.namespace}/pods/${pod.name}/terminal?containerName=${selectedContainer}&shell=${selectedShell}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setTerminalOutput(
          (prev) => prev + `Connected to ${pod.name}/${selectedContainer}\r\n`
        );
        if (inputRef.current) {
          inputRef.current.focus();
        }
      };

      ws.onmessage = (event) => {
        // Handle both text and binary data
        let data = event.data;
        if (typeof data !== 'string') {
          data = new TextDecoder().decode(data);
        }
        
        // Strip ANSI escape sequences
        const cleanData = data.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
        
        setTerminalOutput((prev) => prev + cleanData);
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      };

      ws.onerror = () => {
        setConnectionError("Failed to connect to terminal");
        setIsConnecting(false);
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        setTerminalOutput((prev) => prev + "\r\nConnection closed\r\n");
      };
    } catch (err) {
      setConnectionError(err.message);
      setIsConnecting(false);
      setIsConnected(false);
    }
  };

  const disconnectTerminal = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setTerminalOutput("");
  };

  const handleKeyDown = (e) => {
    if (!isConnected || !wsRef.current) return;

    if (e.key === "Enter") {
      wsRef.current.send(e.target.value + "\r");
      e.target.value = "";
    }
  };

  const sendCommand = (command) => {
    if (!isConnected || !wsRef.current) return;
    wsRef.current.send(command + "\r");
  };

  const handleClose = () => {
    disconnectTerminal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[60vw] w-[60vw] h-[85vh] flex flex-col sm:max-w-[60vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Terminal - {pod?.name}
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
                  {containerOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Shell:</label>
              <Select
                value={selectedShell}
                onValueChange={setSelectedShell}
                disabled={isConnected}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {shellOptions.map((option) => (
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
                  onClick={connectTerminal}
                  disabled={isConnecting || !selectedContainer}
                  className="flex items-center gap-2"
                >
                  {isConnecting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {isConnecting ? "Connecting..." : "Connect"}
                </Button>
              ) : (
                <Button
                  onClick={disconnectTerminal}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  Disconnect
                </Button>
              )}
            </div>
          </div>

          {/* Error Display */}
          {connectionError && (
            <Alert variant="destructive">
              <AlertDescription>{connectionError}</AlertDescription>
            </Alert>
          )}

          {/* Terminal */}
          <div className="flex-1 border rounded-lg bg-black text-green-400 font-mono text-sm overflow-hidden">
            <div
              ref={terminalRef}
              className="h-full p-4 overflow-y-auto whitespace-pre-wrap"
              style={{ minHeight: "400px" }}
            >
              {terminalOutput ||
                "Terminal ready. Click 'Connect' to start a session."}
            </div>
          </div>

          {/* Input */}
          {isConnected && (
            <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
              <span className="text-sm font-mono text-green-600">$</span>
              <input
                ref={inputRef}
                type="text"
                placeholder="Type command and press Enter..."
                className="flex-1 bg-transparent border-none outline-none font-mono text-sm"
                onKeyDown={handleKeyDown}
              />
            </div>
          )}

          {/* Quick Commands */}
          {isConnected && (
            <div className="flex gap-2 p-2 border rounded-lg bg-muted/50">
              <span className="text-sm font-medium">Quick:</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => sendCommand("ls -la")}
              >
                ls -la
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => sendCommand("pwd")}
              >
                pwd
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => sendCommand("ps aux")}
              >
                ps aux
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => sendCommand("clear")}
              >
                clear
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
