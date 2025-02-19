import os
import time
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

#app = Flask(__name__)
app = Flask(__name__, static_folder="/Users/omerfaruk/ChatBot_v1/frontend/chatbot-ui/build")
CORS(app)

# Load API keys
openai_api_key = os.getenv("OPENAI_API_KEY")

# Initialize OpenAI model
model = ChatOpenAI(model="gpt-3.5-turbo")

# Store chat histories per session
store = {}

def get_session_history(session_id: str) -> BaseChatMessageHistory:
    """Retrieve or create a chat history for a session."""
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]

# Define the prompt template
prompt = ChatPromptTemplate.from_messages(
    [
        SystemMessage(content="You are a helpful assistant. Answer all questions to the best of your ability!"),
        MessagesPlaceholder(variable_name="history"),
        MessagesPlaceholder(variable_name="input"),
    ]
)

# Create a chain with message history
runnable = prompt | model

with_message_history = RunnableWithMessageHistory(
    runnable,
    get_session_history,
    input_messages_key="input",
    history_messages_key="history",
)

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    session_id = data.get("session_id", "default_session")
    user_input = data.get("query", "")

    if not user_input:
        return jsonify({"error": "No query provided"}), 400

    history = get_session_history(session_id)
    history.add_user_message(user_input)
    
    def generate():
        """Generate streaming response"""
        for chunk in with_message_history.stream({"input": [HumanMessage(content=user_input)], "history": history.messages},
                                                 config={"configurable": {"session_id": session_id}}):
            yield f"{chunk.content} "
            time.sleep(0.05)  # Simulate streaming delay

    return Response(generate(), content_type="text/plain")

    #response = with_message_history.invoke({"input": [HumanMessage(content=user_input)], "history": history.messages},
    #config={"configurable": {"session_id": session_id}}
    #)
    #history.add_ai_message(response.content)

    #return jsonify({"response": response.content})

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    """Serve React frontend for all unknown routes"""
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
