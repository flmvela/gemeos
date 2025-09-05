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
    return "Gemeos concept chunker is running", 200

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
        
        file_id = attrs.get("file_id")
        domain_id = attrs.get("domain_id")
        domain_slug = attrs.get("domain_slug")

        if not file_id or not domain_id or not domain_slug:
            return "Missing file_id, domain_id, or domain_slug", 400

        print(f"📥 Received request for file_id={file_id}, domain_id={domain_id}, domain_slug={domain_slug}")

        extracted_text = fetch_extracted_text(file_id)
        if not extracted_text:
            return f"No extracted text found for file_id: {file_id}", 404

        guidance, examples = fetch_guidance_from_gcs(domain_slug)
        
        concepts = extract_concepts_with_gemini(extracted_text, domain_slug, guidance, examples)
        print(f"✅ Concepts extracted by AI: {concepts}")

        if concepts:
            save_concepts(concepts, domain_id, file_id)

        return "OK", 200

    except Exception as e:
        print(f"❌ Error processing message: {str(e)}")
        traceback.print_exc()
        return f"Internal Server Error: {str(e)}", 500

# --- Utilities ---
def fetch_extracted_text(file_id):
    response = supabase.table("domain_extracted_files").select("extracted_text").eq("id", file_id).single().execute()
    return response.data.get("extracted_text") if response.data else None

def fetch_guidance_from_gcs(domain_slug):
    try:
        bucket = storage_client.bucket(GUIDANCE_BUCKET)
        
        guidance_blob = bucket.blob(f"{domain_slug}/guidance/concepts/concepts_guidance.md")
        guidance_text = guidance_blob.download_as_text()
        
        examples_blob = bucket.blob(f"{domain_slug}/guidance/concepts/concepts_examples.jsonl")
        examples_text = examples_blob.download_as_text()
        examples = [json.loads(line) for line in examples_text.strip().split('\n')]
        
        print(f"✅ Successfully loaded guidance and {len(examples)} examples from GCS.")
        return guidance_text, examples
    except Exception as e:
        print(f"⚠️ Warning: Could not load guidance files from GCS for domain '{domain_slug}'. Using default prompt. Error: {e}")
        return None, None

def extract_concepts_with_gemini(text, domain, guidance, examples):
    system_prompt = guidance if guidance else "You are an expert educational assistant. Extract key learning concepts from the provided text."
    
    few_shot_examples = ""
    if examples:
        for example in examples:
            input_text = example.get("input")
            output_json = example.get("output")
            if input_text and output_json:
                few_shot_examples += f"EXAMPLE INPUT:\n{input_text}\nEXAMPLE OUTPUT:\n{json.dumps(output_json)}\n\n"

    prompt = f"""{few_shot_examples}Analyze the following educational material for the domain '{domain}'. 
Extract the key learning concepts discussed in the text.
Return your response as a JSON object with a single key "concepts", which contains a list of strings.

TEXT TO ANALYZE:
{text}"""

    model = genai.GenerativeModel('gemini-1.5-pro-latest')
    
    for attempt in range(3):
        try:
            response = model.generate_content(
                [system_prompt, prompt],
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.2  # Ensures consistent, predictable output
                )
            )
            content = response.text
            try:
                parsed_json = json.loads(content)
                return parsed_json.get("concepts", [])
            except (json.JSONDecodeError, TypeError):
                print(f"⚠️ Failed to parse Gemini JSON response: {content}")
                return []
        except google_exceptions.ResourceExhausted as e:
            print(f"Rate limit hit. Waiting for 5 seconds before retry {attempt + 1}/3... Error: {e}")
            time.sleep(5)
        except Exception as e:
            print(f"An unexpected error occurred with Gemini: {e}")
            return []
    
    print("❌ Failed to get response from Gemini after multiple retries.")
    return []

def save_concepts(concepts, domain_id, file_id):
    if not concepts:
        print("No concepts to save.")
        return

    try:
        existing_concepts_res = supabase.table("concepts").select("name").eq("domain_id", domain_id).eq("status", "approved").execute()
        existing_names = {item['name'].lower() for item in existing_concepts_res.data}
        print(f"[DEBUG] Found {len(existing_names)} existing APPROVED concepts for this domain.")

        new_concepts_to_insert = []
        for concept_name in concepts:
            if concept_name.lower() not in existing_names:
                new_concepts_to_insert.append(concept_name)
                existing_names.add(concept_name.lower())

        if not new_concepts_to_insert:
            print("✅ No new concepts to add. All extracted concepts already exist as approved concepts.")
            return

        print(f"[INFO] Found {len(new_concepts_to_insert)} new concepts to save.")

        rows = [{
            "domain_id": domain_id, 
            "source_file_id": file_id, 
            "name": name, 
            "status": "suggested",
            "teacher_id": "00000000-0000-0000-0000-000000000000"
        } for name in new_concepts_to_insert]
        
        supabase.table("concepts").insert(rows).execute()
        print(f"✅ Successfully saved {len(rows)} new concepts to Supabase.")

    except Exception as e:
        print(f"❌ Supabase insert error during save_concepts: {e}")
        traceback.print_exc()

# --- Start App ---
if __name__ == "__main__":
    print("🚀 Starting gemeos-concept-chunker service...")
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
