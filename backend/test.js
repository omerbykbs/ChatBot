async function testChatbot() {
    try {
        const response = await fetch("http://127.0.0.1:5000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                session_id: "user1",
                query: "What is the capital of France?"
            })
        });

        const data = await response.json();
        console.log("Chatbot response:", data.response);
    } catch (error) {
        console.error("Error:", error);
    }
}

testChatbot();
