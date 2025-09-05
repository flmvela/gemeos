import os
import json
import base64
import traceback
import sys
import time
from flask import Flask, request
from supabase import create_client
import google.generativeai as genai
from google.cloud import storage
from google.api_core import exceptions as google_exceptions

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
    return "Gemeos learning goal generator is running", 200

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
        
        concept_id = attrs.get("concept_id")
        domain_slug = attrs.get("domain_slug")

        if not concept_id or not domain_slug:
            return "Missing concept_id or domain_slug", 400

        print(f"📥 Received request for concept_id={concept_id}")

        extracted_text = fetch_text_for_concept(concept_id)
        if not extracted_text:
            return f"No extracted text found for concept_id: {concept_id}", 404

        guidance, examples = fetch_guidance_from_gcs(domain_slug)
        
        approved_goals, rejected_goals = get_feedback_for_prompt(concept_id)
        
        learning_goals = generate_learning_goals_with_gemini(extracted_text, guidance, examples, approved_goals, rejected_goals)
        print(f"✅ Learning goals generated: {learning_goals}")

        if learning_goals:
            save_learning_goals(learning_goals, concept_id)

        return "OK", 200

    except Exception as e:
        print(f"❌ Error processing message: {str(e)}")
        traceback.print_exc()
        return f"Internal Server Error: {str(e)}", 500

# --- Utilities ---
def fetch_text_for_concept(concept_id):
    concept_res = supabase.table("concepts").select("source_file_id").eq("id", concept_id).single().execute()
    if not concept_res.data or not concept_res.data.get("source_file_id"):
        print(f"Could not find source file for concept {concept_id}")
        return None
    
    source_file_id = concept_res.data["source_file_id"]
    text_res = supabase.table("domain_extracted_files").select("extracted_text").eq("id", source_file_id).single().execute()
    return text_res.data.get("extracted_text") if text_res.data else None

def fetch_guidance_from_gcs(domain_slug):
    try:
        bucket = storage_client.bucket(GUIDANCE_BUCKET)
        
        guidance_blob = bucket.blob(f"{domain_slug}/guidance/learning_goals/learning_goals_guidance.md")
        guidance_text = guidance_blob.download_as_text()
        
        examples_blob = bucket.blob(f"{domain_slug}/guidance/learning_goals/learning_goals_examples.jsonl")
        examples_text = examples_blob.download_as_text()
        examples = [json.loads(line) for line in examples_text.strip().split('\n')]
        
        print(f"✅ Successfully loaded guidance and {len(examples)} examples from GCS.")
        return guidance_text, examples
    except Exception as e:
        print(f"⚠️ Warning: Could not load guidance files from GCS for domain '{domain_slug}'. Using default prompt. Error: {e}")
        return None, None

def get_feedback_for_prompt(concept_id):
    try:
        approved_res = supabase.table("learning_goals").select("goal_description").eq("concept_id", concept_id).eq("status", "approved").execute()
        approved_goals = [item['goal_description'] for item in approved_res.data]
        
        rejected_res = supabase.table("learning_goals").select("goal_description").eq("concept_id", concept_id).eq("status", "rejected").execute()
        rejected_goals = [item['goal_description'] for item in rejected_res.data]
        
        print(f"✅ Loaded feedback: {len(approved_goals)} approved, {len(rejected_goals)} rejected.")
        return approved_goals, rejected_goals

    except Exception as e:
        print(f"⚠️ Warning: Could not fetch feedback from database. Error: {e}")
        return [], []

def generate_learning_goals_with_gemini(text, guidance, examples, approved_goals, rejected_goals):
    system_prompt = guidance if guidance else "You are an expert in curriculum design. Generate learning goals based on the provided text."
    
    few_shot_examples = ""
    if examples:
        for example in examples:
            snippet = example.get("snippet")
            goals = example.get("learning_goals")
            if snippet and goals:
                few_shot_examples += f"EXAMPLE INPUT:\n{snippet}\nEXAMPLE OUTPUT:\n{json.dumps({'learning_goals': goals})}\n\n"

    feedback_instructions = ""
    if approved_goals:
        feedback_instructions += f"Here are some examples of GOOD learning goals that have been approved: {json.dumps(approved_goals)}\n"
    if rejected_goals:
        feedback_instructions += f"IMPORTANT: Do NOT suggest any of the following goals, as they have been rejected: {json.dumps(rejected_goals)}\n"

    prompt = f"""{few_shot_examples}{feedback_instructions}Based on the instructions and examples, analyze the following text and generate new, unique learning goals.

TEXT TO ANALYZE:
{text}"""

    # --- ADDED LOGGING BLOCK ---
    print("--- FINAL PROMPT SENT TO GEMINI ---")
    print(f"System Prompt: {system_prompt}")
    print(f"User Prompt: {prompt}")
    print("------------------------------------")
    # --- END OF LOGGING BLOCK ---

    model = genai.GenerativeModel('gemini-1.5-pro-latest')
    
    response = model.generate_content(
        [system_prompt, prompt],
        generation_config=genai.types.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.3
        )
    )
    
    content = response.text
    try:
        parsed_json = json.loads(content)
        return parsed_json.get("learning_goals", [])
    except (json.JSONDecodeError, TypeError):
        print(f"⚠️ Failed to parse Gemini JSON response for learning goals: {content}")
        return []

def save_learning_goals(goals, concept_id):
    if not goals:
        print("No learning goals to save.")
        return

    rows = []
    for goal in goals:
        rows.append({
            "concept_id": concept_id,
            "goal_description": goal.get("goal_description"),
            "bloom_level": goal.get("bloom_level"),
            "goal_type": goal.get("goal_type"),
            "sequence_order": goal.get("sequence_order"),
            "status": "suggested"
        })
    
    supabase.table("learning_goals").insert(rows).execute()
    print(f"✅ Successfully saved {len(rows)} learning goals to Supabase.")

# --- Start App ---
if __name__ == "__main__":
    print("🚀 Starting gemeos-learning-goal-generator service...")
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
