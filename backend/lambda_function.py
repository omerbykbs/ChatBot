import json
import os
import openai
from dotenv import load_dotenv

load_dotenv()

# Use the new OpenAI client
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def lambda_handler(event, context):
    try:
        # Parse JSON request body
        body = json.loads(event.get('body', '{}'))
    except Exception as e:
        print("Error parsing JSON:", str(e))
        return {
            "statusCode": 400,
            "body": json.dumps({
                "error": "Invalid JSON input.",
                "message": str(e)
            })
        }

    query = body.get('query', "").strip()
    if not query:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "Missing 'query' in request body."})
        }

    # Conversation history handling
    conversation = body.get('conversation', [])
    if not isinstance(conversation, list):
        conversation = []

    # Convert conversation history into OpenAI's new message format
    messages = [{"role": "system", "content": "You are a helpful assistant."}]
    for msg in conversation:
        if msg.startswith("User:"):
            messages.append({"role": "user", "content": msg[5:].strip()})
        elif msg.startswith("AI:"):
            messages.append({"role": "assistant", "content": msg[3:].strip()})

    # Append the new user query
    messages.append({"role": "user", "content": query})

    try:
        # Call OpenAI's Chat API using the new method
        response = client.chat.completions.create(
            model="gpt-4",  # Or use "gpt-3.5-turbo"
            messages=messages,
            temperature=0.7,
            max_tokens=200
        )

        # Extract assistant's reply
        answer = response.choices[0].message.content.strip()

        # Append the AI's response to conversation history
        conversation.append(f"User: {query}")
        conversation.append(f"AI: {answer}")

        return {
            "statusCode": 200,
            "body": json.dumps({
                "answer": answer,
                "conversation": conversation
            })
        }

    except Exception as e:
        print("Error calling OpenAI API:", str(e))
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": "Error calling LLM API.",
                "message": str(e)
            })
        }
