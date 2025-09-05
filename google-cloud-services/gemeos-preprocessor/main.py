import os
import json
import logging
import base64
import hashlib
from datetime import datetime
from flask import Flask, request, jsonify
from google.cloud import storage
from google.cloud import pubsub_v1
from supabase import create_client
import PyPDF2
import io

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Initialize clients
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Lazy initialization to avoid startup errors
supabase = None
storage_client = None
publisher_client = None

def get_supabase():
    global supabase
    if supabase is None and SUPABASE_URL and SUPABASE_KEY:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return supabase

def get_storage_client():
    global storage_client
    if storage_client is None:
        storage_client = storage.Client()
    return storage_client

def get_publisher_client():
    global publisher_client
    if publisher_client is None:
        publisher_client = pubsub_v1.PublisherClient()
    return publisher_client

def extract_text_from_pdf(content_bytes):
    """Extract text from PDF content."""
    try:
        pdf_file = io.BytesIO(content_bytes)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        text = []
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            text.append(page.extract_text())
        
        full_text = "\n".join(text)
        print(f"📄 Extracted {len(full_text)} characters from PDF")
        return full_text[:50000]  # Limit to 50k chars
    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        return f"[PDF extraction failed: {str(e)}]"

def extract_text_from_file(content_bytes, mime_type):
    """Extract text based on mime type."""
    if mime_type == "application/pdf":
        return extract_text_from_pdf(content_bytes)
    elif mime_type and "text" in mime_type:
        return content_bytes.decode('utf-8', errors='ignore')[:50000]
    else:
        return f"Unsupported file type: {mime_type}"

def calculate_content_hash(content_bytes):
    """Calculate SHA-256 hash of content."""
    return hashlib.sha256(content_bytes).hexdigest()

def publish_extraction_request(record_id, domain_id, file_path, extracted_text, content_hash, metadata):
    """Publish message to content-extraction-requests topic for extractor services."""
    try:
        publisher = get_publisher_client()
        topic_path = publisher.topic_path("gemeos-467015", "content-extraction-requests")
        
        message_data = {
            "record_id": record_id,
            "domain_id": domain_id, 
            "file_path": file_path,
            "extracted_text": extracted_text,
            "content_hash": content_hash,
            "metadata": metadata,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Publish the message
        future = publisher.publish(
            topic_path,
            json.dumps(message_data).encode('utf-8'),
            record_id=record_id,
            domain_id=domain_id
        )
        
        message_id = future.result()
        print(f"📢 Published extraction request: {message_id}")
        return message_id
        
    except Exception as e:
        print(f"❌ Failed to publish extraction request: {e}")
        return None

@app.route("/", methods=["POST"])
def handle_pubsub():
    """Handle Pub/Sub messages from GCS."""
    try:
        envelope = request.get_json()
        if not envelope:
            return "Bad Request: no Pub/Sub message received", 400

        if "message" not in envelope:
            return "Bad Request: no Pub/Sub message received", 400

        pubsub_message = envelope["message"]
        
        # Decode the Pub/Sub message
        if "data" in pubsub_message:
            data = base64.b64decode(pubsub_message["data"]).decode("utf-8")
            message_data = json.loads(data)
        else:
            return "Bad Request: no data in Pub/Sub message", 400

        # Extract file information from GCS notification
        bucket_name = message_data.get("bucket")
        file_path = message_data.get("name")
        
        print(f"📥 File uploaded: gs://{bucket_name}/{file_path}")
        
        # Skip .keep files
        if file_path.endswith('.keep'):
            print("Skipping .keep file")
            return "", 200
        
        # Download file from GCS
        storage_client = get_storage_client()
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(file_path)
        
        # Download to memory
        content_bytes = blob.download_as_bytes()
        print(f"✅ File downloaded to memory")
        
        # Get file metadata
        mime_type = blob.content_type or "application/octet-stream"
        print(f"📄 Detected MIME type: {mime_type}")
        
        # Extract text content
        extracted_text = extract_text_from_file(content_bytes, mime_type)
        print(f"📄 Extracted content preview:")
        print(extracted_text[:500])  # Show first 500 chars
        
        # Calculate content hash
        content_hash = calculate_content_hash(content_bytes)
        
        # Find matching record in database by bucket_path
        supabase = get_supabase()
        if supabase:
            try:
                # Query using bucket_path which should match the file path from GCS
                result = supabase.table("domain_extracted_files")\
                    .select("*")\
                    .eq("bucket_path", file_path)\
                    .single()\
                    .execute()
                
                if result.data:
                    record = result.data
                    print(f"✅ Found matching database record: {record['id']}")
                    
                    # Update the record with extracted content (without status field for now)
                    update_data = {
                        "extracted_text": extracted_text,
                        "content_hash": content_hash,
                        "metadata_json": {
                            "mime_type": mime_type,
                            "size_bytes": len(content_bytes),
                            "extraction_timestamp": datetime.utcnow().isoformat(),
                            "pages": len(PyPDF2.PdfReader(io.BytesIO(content_bytes)).pages) if mime_type == "application/pdf" else None
                        }
                    }
                    
                    update_result = supabase.table("domain_extracted_files")\
                        .update(update_data)\
                        .eq("id", record["id"])\
                        .execute()
                    
                    print(f"✅ Updated database record with extracted content")
                    
                    # Publish extraction request for the three extractor services
                    message_id = publish_extraction_request(
                        record_id=record["id"],
                        domain_id=record["domain_id"],
                        file_path=f"gs://{bucket_name}/{file_path}",
                        extracted_text=extracted_text,
                        content_hash=content_hash,
                        metadata=update_data["metadata_json"]
                    )
                    
                    return jsonify({
                        "success": True, 
                        "record_id": record["id"],
                        "message_id": message_id
                    }), 200
                else:
                    print(f"❌ No matching record found for path: {file_path}")
                    return jsonify({"error": "No matching database record found"}), 404
                    
            except Exception as e:
                print(f"❌ Database error: {str(e)}")
                return jsonify({"error": str(e)}), 500
        else:
            print("❌ Supabase client not initialized")
            return jsonify({"error": "Database not configured"}), 500
            
    except Exception as e:
        print(f"❌ Error processing message: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "gemeos-preprocessor-gcs",
        "timestamp": datetime.utcnow().isoformat()
    }), 200

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    print(f"Starting GCS Preprocessor on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)