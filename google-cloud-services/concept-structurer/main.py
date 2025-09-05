import os
import json
import base64
import traceback
import sys
from flask import Flask, request
from supabase import create_client
import google.generativeai as genai
from google.cloud import storage

# --- Flask App ---
app = Flask(__name__)

# --- Config / Secrets ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") 

# --- Clients ---
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
storage_client = storage.Client()
genai.configure(api_key=GEMINI_API_KEY)

# --- Constants ---
GUIDANCE_BUCKET = "gemeos-guidance"

# --- Healthcheck Route ---
@app.route("/", methods=["GET"])
def health_check():
    return "Gemeos concept structurer is running", 200

# --- Main Ingestion Route ---
@app.route("/", methods=["POST"])
def handle_pubsub():
    try:
        envelope = request.get_json()
        if not envelope or "message" not in envelope:
            return "Bad Request: No Pub/Sub message received", 400

        pubsub_message = envelope["message"]
        if "data" not in pubsub_message:
            return "Bad Request: No data in message", 400

        data = base64.b64decode(pubsub_message["data"]).decode("utf-8")
        attrs = json.loads(data)
        
        domain_id = attrs.get("domain_id")
        domain_slug = attrs.get("domain_slug")

        if not domain_id or not domain_slug:
            return "Missing domain_id or domain_slug", 400

        print(f"📥 Received structuring request for domain_id={domain_id}")

        # 1. Fetch all approved concepts for the domain
        concepts = fetch_approved_concepts(domain_id)
        if not concepts:
            print("✅ No approved concepts found to structure.")
            return "OK", 200

        # 2. Fetch the structuring guidance from GCS
        structuring_guidance = fetch_structuring_guidance(domain_slug)
        if not structuring_guidance:
            return "Could not load structuring guidance from GCS", 500

        # 3. Call Gemini to get the concept hierarchy
        hierarchy = structure_concepts_with_gemini(concepts, structuring_guidance)
        print(f"✅ AI suggested hierarchy: {hierarchy}")

        # 4. --- MODIFIED: Save the suggestion to the new table ---
        if hierarchy:
            save_suggested_hierarchy(domain_id, hierarchy)

        return "OK", 200

    except Exception as e:
        print(f"❌ Error processing message: {str(e)}")
        traceback.print_exc()
        return f"Internal Server Error: {str(e)}", 500

# --- Utilities ---
def fetch_approved_concepts(domain_id):
    response = supabase.table("concepts").select("id, name").eq("domain_id", domain_id).eq("status", "approved").execute()
    return response.data if response.data else []

def fetch_structuring_guidance(domain_slug):
    try:
        bucket = storage_client.bucket(GUIDANCE_BUCKET)
        blob = bucket.blob(f"{domain_slug}/guidance/concepts/concept-structuring_guidance.md")
        return blob.download_as_text()
    except Exception as e:
        print(f"⚠️ Error: Could not load structuring guidance from GCS. Error: {e}")
        return None

def structure_concepts_with_gemini(concepts, guidance):
    concept_list = [concept['name'] for concept in concepts]
    
    prompt = f"""{guidance}

Based on the rules above, analyze the following list of learning concepts. Determine the parent-child relationships between them to form a logical learning hierarchy.

Return your response as a JSON object with a single key "hierarchy", which contains a list of objects. Each object must have two keys: "concept" and "parent". If a concept is a top-level (root) concept, its parent should be null.

LIST OF CONCEPTS:
{json.dumps(concept_list)}"""

    model = genai.GenerativeModel('gemini-1.5-pro-latest')
    
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            response_mime_type="application/json"
        )
    )
    
    content = response.text
    try:
        parsed_json = json.loads(content)
        return parsed_json.get("hierarchy", [])
    except (json.JSONDecodeError, TypeError):
        print(f"⚠️ Failed to parse Gemini JSON response for hierarchy: {content}")
        return []

# --- NEW: Function to save the AI's suggestion ---
def save_suggested_hierarchy(domain_id, hierarchy):
    if not hierarchy:
        print("No hierarchy data to save.")
        return

    try:
        supabase.table("suggested_concept_hierarchies").insert({
            "domain_id": domain_id,
            "suggested_structure": hierarchy,
            "status": "pending"
        }).execute()
        print(f"✅ Successfully saved suggested hierarchy to the database.")
    except Exception as e:
        print(f"❌ Error saving suggested hierarchy: {e}")
        traceback.print_exc()


# --- Start App ---
if __name__ == "__main__":
    print("🚀 Starting gemeos-concept-structurer service...")
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
