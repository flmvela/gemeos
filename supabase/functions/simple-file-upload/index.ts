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
    console.log('Simple file upload function called');

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
    const contentType = formData.get('contentType') as string || 'concept';

    console.log('Upload details:', {
      fileName: file?.name,
      fileSize: file?.size,
      domainId,
      domainSlug,
      contentType
    });

    if (!file || !domainId || !domainSlug) {
      console.error('Missing required fields');
      throw new Error('Missing required fields: file, domainId, or domainSlug');
    }

    // Create a simple file record in the database
    // For now, we'll just store the file metadata and simulate the storage path
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const safeFileName = `${file.name.replace(/\.[^/.]+$/, "")}-${timestamp}.${fileExtension}`;
    const simulatedStoragePath = `gs://gemeos-temp-uploads/${domainSlug}/${safeFileName}`;

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
        storage_path: simulatedStoragePath,
        uploaded_by_type: uploaderType
      })
      .select()
      .maybeSingle();

    if (uploadError) {
      console.error('Error recording file upload:', uploadError);
      throw uploadError;
    }

    console.log('File upload recorded:', fileUpload);

    // Also create a domain_extracted_files record if the table exists
    try {
      const { data: extraction, error: extractionError } = await supabase
        .from('domain_extracted_files')
        .insert({
          domain_id: domainId,
          file_name: file.name,
          file_path: simulatedStoragePath,
          bucket_path: `${domainSlug}/${safeFileName}`,
          uploaded_by: user.user.id,
          mime_type: file.type,
          status: 'pending',
          content_type: contentType,
          extraction_status: 'pending'
        })
        .select()
        .maybeSingle();

      if (extractionError) {
        console.warn('Could not create extraction record (table might not exist):', extractionError);
      } else {
        console.log('Extraction record created:', extraction);
      }
    } catch (e) {
      console.warn('domain_extracted_files table might not exist, skipping extraction record');
    }

    return new Response(JSON.stringify({
      success: true,
      upload: fileUpload,
      message: 'File upload simulated successfully (file stored in database only)',
      note: 'This is a simplified upload that stores metadata only. Actual file storage to GCS is not implemented yet.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in simple-file-upload function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});