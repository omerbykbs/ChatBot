from flask import Flask, request, jsonify, render_template
import openai
import os
from dotenv import load_dotenv

app = Flask(__name__)
load_dotenv()

# Create a client instance with your API key
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    query = data.get("query", "")

    if not query:
        return jsonify({"error": "No query provided."}), 400

    try:
        # Use the new client.chat.completions.create() method
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": query}]
        )

        # Access the response content using the new attribute-based access
        answer = response.choices[0].message.content
        return jsonify({"response": answer})

    except Exception as e:
        return jsonify({"error": "Error calling LLM API.", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)