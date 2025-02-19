import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, TextField, Button, Typography, IconButton } from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [spinner, setSpinner] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(() => {
        return JSON.parse(localStorage.getItem("darkMode")) ?? false;
    });    
    const chatBoxRef = useRef(null);

    useEffect(() => {
        if (chatBoxRef.current) {
            const chatBox = chatBoxRef.current;
            chatBox.scrollTop = chatBox.scrollHeight; 
        }
    }, [messages]);

    useEffect(() => {
        if (darkMode) {
            document.body.classList.add("dark-mode");
        } else {
            document.body.classList.remove("dark-mode");
        }
    }, [darkMode]);

    useEffect(() => {
        const savedMode = JSON.parse(localStorage.getItem("darkMode"));
        if (savedMode) {
            setDarkMode(savedMode);
        }
    }, []);

    const toggleChat = () => {
        setIsOpen((prev) => !prev);
    };

    const toggleDarkMode = () => {
        setDarkMode((prev) => {
            const newMode = !prev;
            localStorage.setItem("darkMode", JSON.stringify(newMode));
            return newMode;
        });
    };
    
    const sendMessage = async () => {
        if (!input.trim()) return;
    
        const userMessage = { text: input, sender: "user" };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setInput("");
    
        setMessages((prevMessages) => [...prevMessages, { text: "", sender: "bot", streaming: true }]);

        try {
            const response = await fetch("http://127.0.0.1:5000/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: "user1", query: input })
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
    
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let botMessage = "";
    
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                botMessage += decoder.decode(value, { stream: true });
    
                setMessages((prevMessages) => {
                    const updatedMessages = [...prevMessages];
                    updatedMessages[updatedMessages.length - 1] = { text: botMessage, sender: "bot", streaming: true };
                    return updatedMessages;
                });
            }
            
            setMessages((prevMessages) => {
                const updatedMessages = [...prevMessages];
                updatedMessages[updatedMessages.length - 1] = { text: botMessage, sender: "bot", streaming: false };
                return updatedMessages;
            });

        } catch (error) {
            console.error("Error:", error);
            setMessages((prevMessages) => prevMessages.slice(0, -1).concat({ text: "Error occurred", sender: "bot" }));
        }
    };

    return (
        <>
            {/* Dark Mode Toggle Button */}
            <IconButton 
                onClick={toggleDarkMode} 
                sx={{ 
                    position: "fixed", 
                    top: 20, 
                    right: 20, 
                    zIndex: 1000,
                    backgroundColor: darkMode ? "#222" : "#fff",
                    color: darkMode ? "white" : "black",
                    "&:hover": { backgroundColor: darkMode ? "#444" : "#ddd" }
                }}>
                {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>

            {/* Floating Button to Toggle Chat */}
            <IconButton 
                onClick={toggleChat} 
                sx={{
                    position: "fixed",
                    bottom: 20,
                    right: 20,
                    backgroundColor: "#007bff",
                    color: "white",
                    width: 60,
                    height: 60,
                    "&:hover": { backgroundColor: "#0056b3" }
                }}
            >
                {isOpen ? <CloseIcon /> : <ChatIcon />}
            </IconButton>

            {/* Chatbot Popup */}
            {isOpen && (
                <Card sx={{
                    position: "fixed",
                    bottom: isOpen ? 80 : 0, 
                    right: 20,
                    width: 350,
                    height: isOpen ? 650 : 0,
                    boxShadow: isOpen ? 5 : 0,
                    display: "flex",
                    flexDirection: "column",
                    opacity: isOpen ? 1 : 0, 
                    transition: "opacity 0.3s ease-in-out, height 0.3s ease-in-out"
                }}>
                    <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%", padding: 0 }}>
                        <Typography variant="h6" align="center">Chatbot</Typography>
                        <div ref={chatBoxRef} style={{ flex: 1, overflowY: "auto", padding: "10px", scrollBehavior: "smooth"  }}>
                        {messages.map((msg, index) => (
                            <div key={index} style={{
                                display: "flex",
                                justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
                                marginBottom: "10px"
                            }}>
                                <Typography sx={{
                                    backgroundColor: msg.sender === "user" ? "#007bff" : "#f1f1f1",
                                    color: msg.sender === "user" ? "white" : "black",
                                    padding: "10px",
                                    borderRadius: "15px",
                                    maxWidth: "75%",
                                    wordWrap: "break-word",
                                    textAlign: "left",
                                    lineHeight: "1.4",
                                    fontStyle: msg.typing ? "italic" : "normal" 
                                }}>
                                    {msg.text}
                                </Typography>
                            </div>
                        ))}
                        {/* Input section pinned to bottom */}
                        </div >
                        <div style={{ padding: "10px" }}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                placeholder="Type a message..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                            />
                            <Button fullWidth variant="contained" color="primary" onClick={sendMessage} sx={{ mt: 1 }}>
                                Send
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </>
    );
};


export default Chatbot;
