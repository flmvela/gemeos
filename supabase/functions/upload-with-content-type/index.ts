import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Upload with content type function called');

    // Get the authorization header to verify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    // Verify the JWT token and get user info
    const token = authHeader.replace('Bearer ', '');
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user?.user) {
      console.error('Auth error:', userError);
      throw new Error('Invalid authentication token');
    }

    console.log('Authenticated user:', user.user.id);

    // Parse the multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const domainId = formData.get('domainId') as string;
    const domainSlug = formData.get('domainSlug') as string;

    console.log('Upload details:', {
      fileName: file?.name,
      fileSize: file?.size,
      domainId,
      domainSlug
    });

    if (!file || !domainId || !domainSlug) {
      console.error('Missing required fields');
      throw new Error('Missing required fields: file, domainId, or domainSlug');
    }

    // Generate file path for general ingestion
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const baseFileName = file.name.replace(/\.[^/.]+$/, "");
    // Sanitize filename: replace spaces and special characters with hyphens
    const sanitizedFileName = baseFileName.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-');
    const safeFileName = `${sanitizedFileName}-${timestamp}.${fileExtension}`;
    
    // Domain-specific bucket mapping
    const domainBuckets = {
      'jazz-music': 'gemeos-jazz',
      'jazz': 'gemeos-jazz',
      'gmat': 'gemeos-gmat'
    };
    
    const bucketName = domainBuckets[domainSlug] || 'gemeos-ingestion-bucket';
    
    // General ingestion path - all files go to /ingestion/ folder
    const storagePath = `ingestion/${safeFileName}`;

    console.log('Domain-specific bucket routing:', {
      domainSlug,
      mappedBucket: bucketName,
      finalPath: storagePath
    });

    // Try to upload to GCS, but continue if it fails
    let gcsUploadSuccess = false;
    let gcsError = null;

    try {
      // Get Google Cloud service account from environment
      const serviceAccountKey = Deno.env.get('GOOGLE_CLOUD_SERVICE_ACCOUNT');
      if (!serviceAccountKey) {
        throw new Error('Google Cloud service account key not configured');
      }

      let serviceAccount;
      try {
        serviceAccount = JSON.parse(serviceAccountKey);
      } catch (error) {
        throw new Error('Invalid service account JSON format');
      }

      // Get Google Cloud access token
      const accessToken = await getGoogleCloudAccessToken(serviceAccount);
      
      // Convert file to array buffer
      const fileBuffer = await file.arrayBuffer();
      
      // Upload to Google Cloud Storage
      const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${encodeURIComponent(storagePath)}`;
      
      console.log('📤 Uploading to GCS...');
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': file.type || 'application/octet-stream',
          'Content-Length': fileBuffer.byteLength.toString(),
          'x-goog-meta-uploader-id': user.user.id,
          'x-goog-meta-domain-id': domainId,
          'x-goog-meta-content-type': contentType,
          'x-goog-meta-original-name': file.name,
          'x-goog-meta-upload-timestamp': Date.now().toString(),
        },
        body: fileBuffer,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('GCS upload error:', errorText);
        throw new Error(`GCS upload failed: ${uploadResponse.status} - ${errorText}`);
      }

      const gcsResponse = await uploadResponse.json();
      console.log('GCS upload successful:', gcsResponse);
      gcsUploadSuccess = true;

      console.log('✅ File uploaded successfully to GCS. Database records will be created next.');

    } catch (uploadError) {
      console.error('GCS upload failed, continuing with database records only:', uploadError);
      gcsError = uploadError.message;
      // Don't throw - we'll continue and create database records
    }
    
    // Determine user type
    const userRole = user.user.app_metadata?.role || 'teacher';
    const uploaderType = userRole === 'admin' ? 'admin' : 'teacher';

    // Insert file upload record
    const { data: fileUpload, error: uploadError } = await supabase
      .from('file_uploads')
      .insert({
        uploaded_by: user.user.id,
        domain_id: domainId,
        file_name: file.name,
        mime_type: file.type,
        file_size: file.size,
        storage_path: `gs://${bucketName}/${storagePath}`,
        uploaded_by_type: uploaderType
      })
      .select()
      .maybeSingle();

    if (uploadError) {
      console.error('Error recording file upload:', uploadError);
      throw uploadError;
    }

    console.log('File upload recorded:', fileUpload);

    // Create domain_extracted_files record with content type
    let extractionRecord = null;
    try {
      const { data: extraction, error: extractionError } = await supabase
        .from('domain_extracted_files')
        .insert({
          domain_id: domainId,
          file_name: file.name,
          file_path: `gs://${bucketName}/${storagePath}`,
          bucket_path: storagePath,
          uploaded_by: user.user.id,
          mime_type: file.type,
          status: 'pending'
        })
        .select()
        .maybeSingle();

      if (extractionError) {
        console.warn('Could not create extraction record:', extractionError);
      } else {
        extractionRecord = extraction;
        console.log('Extraction record created:', extraction);
      }
    } catch (e) {
      console.warn('domain_extracted_files table might not exist, skipping extraction record');
    }

    return new Response(JSON.stringify({
      success: true,
      upload: fileUpload,
      extraction: extractionRecord,
      gcsPath: `gs://${bucketName}/${storagePath}`,
      message: `File "${file.name}" uploaded for processing`,
      storagePath: storagePath,
      gcsUploadSuccess: gcsUploadSuccess,
      gcsError: gcsError,
      note: gcsUploadSuccess 
        ? 'File successfully uploaded to GCS and database records created.'
        : `Database records created. GCS upload failed: ${gcsError}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in upload-with-content-type function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to get Google Cloud access token
async function getGoogleCloudAccessToken(serviceAccount: any): Promise<string> {
  // Create JWT for Google Cloud authentication
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600, // 1 hour
  };

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: await createJWT(payload, serviceAccount.private_key),
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Token request failed:', errorText);
    throw new Error('Failed to get access token from Google');
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Helper function to create JWT
async function createJWT(payload: any, privateKey: string): Promise<string> {
  const encoder = new TextEncoder();
  
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/[+/]/g, c => c === '+' ? '-' : '_').replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/[+/]/g, c => c === '+' ? '-' : '_').replace(/=/g, '');
  
  const message = `${encodedHeader}.${encodedPayload}`;
  
  // Import the private key
  const keyData = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Sign the message
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(message)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/[+/]/g, c => c === '+' ? '-' : '_')
    .replace(/=/g, '');

  return `${message}.${encodedSignature}`;
}