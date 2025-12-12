import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Paper,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

interface ChatMessage {
  type: "user" | "llm" | "action_result" | "error";
  content: string | object;
  timestamp: Date;
}

const LLMChat: React.FC = () => {
  const [message, setMessage] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const processLlmResponse = async (llmResponse: string | object) => {
    if (
      typeof llmResponse === "object" &&
      llmResponse !== null &&
      "action" in llmResponse
    ) {
      const action = llmResponse as {
        action: string;
        path: string;
        content: string;
        args?: Record<string, unknown>;
      };
      try {
        let apiUrl: string;
        let method: string = "GET";
        let body: object | null = null;

        switch (action.action) {
          case "list":
            apiUrl = `/api/files/list?path=${encodeURIComponent(action.path)}`;
            break;
          case "read":
            apiUrl = `/api/files/read?path=${encodeURIComponent(action.path)}${
              action.args && typeof action.args.previewLines === "number"
                ? `&previewLines=${action.args.previewLines}`
                : ""
            }`;
            break;
          case "write":
            method = "POST";
            apiUrl = "/api/files/write";
            body = {
              path: action.path,
              content: action.content,
            };
            break;
          case "delete":
            method = "POST";
            apiUrl = "/api/files/delete";
            body = { path: action.path };
            break;
          default:
            throw new Error(`Unknown action: ${action.action}`);
        }

        const res = await fetch(apiUrl, {
          method,
          headers: {
            "Content-Type": body ? "application/json" : undefined,
            Authorization: `Bearer ${import.meta.env.VITE_API_TOKEN}`,
          } as HeadersInit,
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(
            `Backend action error: ${res.statusText} - ${errorText}`
          );
        }

        const actionResult = await res.text();

        setChatHistory((prev) => [
          ...prev,
          {
            type: "action_result",
            content: actionResult,
            timestamp: new Date(),
          },
        ]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
        setChatHistory((prev) => [
          ...prev,
          {
            type: "error",
            content: `Error executing action ${action.action}: ${
              err instanceof Error ? err.message : String(err)
            }`,
            timestamp: new Date(),
          },
        ]);
      }
    } else {
      setChatHistory((prev) => [
        ...prev,
        { type: "llm", content: llmResponse, timestamp: new Date() },
      ]);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      type: "user",
      content: message,
      timestamp: new Date(),
    };
    setChatHistory((prev) => [...prev, userMessage]);
    setMessage("");

    setLoading(true);
    setError(null);

    let textResponse: string = "";
    try {
      const res = await fetch("/api/llm/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_API_TOKEN}`,
        },
        body: JSON.stringify({ prompt: message }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error: ${res.statusText} - ${errorText}`);
      }
      textResponse = await res.text(); // Assign here
      const jsonResponse = JSON.parse(textResponse);
      await processLlmResponse(jsonResponse);
    } catch (err: unknown) {
      // If not JSON, treat as plain text from LLM
      if (
        typeof err === "object" &&
        err !== null &&
        "name" in err &&
        err.name === "SyntaxError"
      ) {
        await processLlmResponse(textResponse);
      } else {
        setError(err instanceof Error ? err.message : String(err));
        setChatHistory((prev) => [
          ...prev,
          {
            type: "error",
            content: `Error communicating with LLM: ${
              err instanceof Error ? err.message : String(err)
            }`,
            timestamp: new Date(),
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%", // Ensure the chat component takes full height of its parent
        bgcolor: "#202123", // Dark gray background
      }}
    >
      {/* Chat History Area */}
      <Box
        ref={chatHistoryRef}
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          p: 3, // Increased padding for better visual spacing
          display: "flex",
          flexDirection: "column",
          gap: 2, // Increased gap between messages
          maxWidth: "100%", // Chat container now takes full width
          // mx: "auto", // Removed centering to allow full width
        }}
      >
        {chatHistory.map((msg, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
            }}
          >
            <Paper
              elevation={0} // No elevation for bubbles
              sx={{
                p: 1.5,
                maxWidth: "80%", // Adjusted maxWidth for chat bubbles
                bgcolor:
                  msg.type === "user"
                    ? "#343541" // Darker gray for user messages
                    : "#444654", // Lighter dark gray for LLM messages
                border: "none", // Removed border for LLM messages
                color: "#D4D4D4", // Light gray for text
                borderRadius: "8px", // Slightly less rounded corners for bubbles
                wordBreak: "break-word",
                boxShadow: "none", // Removed shadow for bubbles
              }}
            >
              <Typography
                variant="body2" // Use body2 variant for smaller text
                sx={{
                  display: "block",
                  textAlign: msg.type === "user" ? "right" : "left",
                  mb: 0.5,
                  color: "#A0A0A0", // Slightly darker light gray for timestamps
                  fontSize: "0.78rem", // Slightly larger font size for timestamps
                  fontWeight: 400, // Regular font weight for timestamps
                }}
              >
                {msg.type === "user"
                  ? "You"
                  : msg.type === "llm"
                  ? "AI"
                  : msg.type === "action_result"
                  ? "System Action"
                  : "Error"}{" "}
                - {msg.timestamp.toLocaleTimeString()}
              </Typography>
              {typeof msg.content === "string" ? (
                <Typography
                  variant="body1"
                  sx={{ fontSize: "1rem", fontWeight: 400, color: "#D4D4D4" }} // Set text color for content
                >
                  {msg.content}
                </Typography>
              ) : (
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    fontSize: "0.95rem", // Adjusted font size for code blocks
                    fontWeight: 400, // Regular font weight for code blocks
                    color: "#D4D4D4", // Set text color for code blocks
                  }}
                >
                  <Typography variant="body1" component="code">
                    {JSON.stringify(msg.content, null, 2)}
                  </Typography>
                </pre>
              )}
            </Paper>
          </Box>
        ))}

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <CircularProgress size={24} sx={{ color: "#D4D4D4" }} />
            <Typography variant="body2" sx={{ ml: 1, color: "#D4D4D4" }}>
              Thinking...
            </Typography>
          </Box>
        )}
        {error && (
          <Typography
            color="error"
            sx={{ mt: 2, textAlign: "center", color: "#FF6B6B" }}
          >
            Error: {error}
          </Typography>
        )}
      </Box>

      {/* Message Input Area */}
      <Box
        sx={{
          p: 2,
          borderTop: "1px solid #40414F", // Darker border for input area
          display: "flex",
          alignItems: "center",
          gap: 1,
          bgcolor: "#343541", // Lighter dark gray background for input area
          maxWidth: "100%", // Input area now takes full width
          // mx: "auto", // Removed centering to allow full width
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Ask the AI about files..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !loading) {
              handleSendMessage();
            }
          }}
          InputProps={{
            sx: {
              bgcolor: "#40414F", // Darker gray background for input field
              borderRadius: "8px", // Consistent rounded corners
              color: "#D4D4D4", // Light gray text color
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "transparent", // No visible border
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "transparent", // No visible border on hover
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "transparent", // No visible border on focus
              },
            },
          }}
          sx={{
            boxShadow: "0px 0px 0px 2px transparent", // Initial transparent shadow
            transition: "box-shadow 0.2s ease-in-out", // Smooth transition for shadow
            "&.Mui-focused": {
              boxShadow: "0px 0px 0px 2px #19C37D", // Green shadow on focus
            },
            // Remove direct bgcolor and borderRadius from here as it's now in InputProps
          }}
        />
        <Button
          variant="contained"
          onClick={handleSendMessage}
          disabled={loading || !message.trim()}
          endIcon={<SendIcon />}
          sx={{
            minWidth: "100px", // Adjusted minWidth
            height: "56px",
            bgcolor: "#19C37D", // Brighter ChatGPT green for send button
            "&:hover": {
              bgcolor: "#15A76E", // Darker green on hover
            },
            borderRadius: "8px", // More rounded corners
          }}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default LLMChat;
