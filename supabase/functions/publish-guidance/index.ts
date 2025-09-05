import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PublishRequest {
  domainName: string;
  area: string;
  type: 'guidance' | 'examples';
  notifyEndpoints?: string[]; // Optional webhook URLs to notify after publishing
}

interface PublishResult {
  fileExists: boolean;
  fileSize?: number;
  lastModified?: string;
  contentPreview?: string;
  notificationResults?: Array<{
    endpoint: string;
    success: boolean;
    error?: string;
  }>;
}

/**
 * Get Google Cloud access token for GCS operations
 */
async function getGoogleCloudAccessToken(): Promise<string> {
  const serviceAccountJson = Deno.env.get('GOOGLE_CLOUD_SERVICE_ACCOUNT');
  if (!serviceAccountJson) {
    throw new Error('Google Cloud service account not configured');
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const jwt = await createJWT(payload, serviceAccount.private_key);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create JWT for Google Cloud authentication
 */
async function createJWT(payload: any, privateKey: string): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const signingInput = `${encodedHeader}.${encodedPayload}`;

  // Import the private key
  const keyData = privateKey.replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
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

  // Sign the data
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${signingInput}.${encodedSignature}`;
}

/**
 * Verify that the guidance file exists in Google Cloud Storage and get metadata
 */
async function verifyGuidanceFile(domainName: string, area: string, type: 'guidance' | 'examples'): Promise<PublishResult> {
  try {
    const accessToken = await getGoogleCloudAccessToken();
    const bucketName = 'gemeos-guidance';
    const extension = type === 'examples' ? '.jsonl' : '.md';
    const fileName = type === 'examples' ? `${area}_examples${extension}` : `${area}_guidance${extension}`;
    const objectPath = `${domainName}/guidance/${area}/${fileName}`;

    console.log(`Verifying file: ${objectPath} in bucket: ${bucketName}`);

    // Check if file exists and get metadata
    const metadataUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(objectPath)}`;
    const metadataResponse = await fetch(metadataUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (metadataResponse.status === 404) {
      return {
        fileExists: false
      };
    }

    if (!metadataResponse.ok) {
      throw new Error(`Failed to get file metadata: ${metadataResponse.status} ${metadataResponse.statusText}`);
    }

    const metadata = await metadataResponse.json();

    // Get content for preview (first 200 characters)
    const contentUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(objectPath)}?alt=media`;
    const contentResponse = await fetch(contentUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Range': 'bytes=0-199', // First 200 bytes for preview
      },
    });

    let contentPreview = '';
    if (contentResponse.ok) {
      contentPreview = await contentResponse.text();
    }

    return {
      fileExists: true,
      fileSize: parseInt(metadata.size || '0'),
      lastModified: metadata.updated || metadata.timeCreated,
      contentPreview: contentPreview.length > 0 ? contentPreview + (metadata.size > 200 ? '...' : '') : undefined
    };

  } catch (error) {
    console.error('Error verifying guidance file:', error);
    throw error;
  }
}

/**
 * Notify external endpoints about the published content
 */
async function notifyEndpoints(
  endpoints: string[], 
  domainName: string, 
  area: string, 
  type: string,
  publishResult: PublishResult
): Promise<Array<{ endpoint: string; success: boolean; error?: string }>> {
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Notifying endpoint: ${endpoint}`);
      
      const notificationPayload = {
        event: 'guidance_published',
        domain: domainName,
        area: area,
        type: type,
        publishedAt: new Date().toISOString(),
        fileMetadata: {
          exists: publishResult.fileExists,
          size: publishResult.fileSize,
          lastModified: publishResult.lastModified
        }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationPayload),
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000) // 10 seconds
      });

      if (response.ok) {
        results.push({ endpoint, success: true });
        console.log(`Successfully notified ${endpoint}`);
      } else {
        results.push({ 
          endpoint, 
          success: false, 
          error: `HTTP ${response.status}: ${response.statusText}` 
        });
      }
    } catch (error) {
      results.push({ 
        endpoint, 
        success: false, 
        error: error.message 
      });
      console.error(`Failed to notify ${endpoint}:`, error);
    }
  }
  
  return results;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client for authentication
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });

    // Verify authentication
    const { data: userResult, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userResult?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check user role (admin or teacher required)
    const role = (userResult.user.app_metadata as any)?.role || (userResult.user.user_metadata as any)?.role;
    if (role !== 'admin' && role !== 'teacher') {
      return new Response(JSON.stringify({ error: 'Forbidden: Requires admin or teacher role' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { domainName, area, type, notifyEndpoints: endpoints = [] }: PublishRequest = await req.json();

    if (!domainName || !area || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: domainName, area, type' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Publishing guidance content:', { domainName, area, type, user: userResult.user.email });

    // Step 1: Verify the file exists in GCS and get metadata
    const publishResult = await verifyGuidanceFile(domainName, area, type);
    
    if (!publishResult.fileExists) {
      return new Response(
        JSON.stringify({ 
          error: 'File not found in Google Cloud Storage',
          domainName,
          area,
          type,
          expectedPath: `gs://gemeos-guidance/${domainName}/guidance/${area}/${area}_${type}.${type === 'examples' ? 'jsonl' : 'md'}`
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 2: Notify external endpoints if provided
    let notificationResults: Array<{ endpoint: string; success: boolean; error?: string }> = [];
    if (endpoints.length > 0) {
      console.log(`Notifying ${endpoints.length} endpoints`);
      notificationResults = await notifyEndpoints(endpoints, domainName, area, type, publishResult);
    }

    const publishedAt = new Date().toISOString();
    console.log(`Successfully published ${type} for ${domainName}/${area} at ${publishedAt}`);

    // TODO: Future enhancements could include:
    // - Update a published_content table to track publication history
    // - Invalidate CDN caches
    // - Update search indexes
    // - Send notifications to subscribers
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${type} published successfully`,
        domainName,
        area,
        type,
        publishedAt,
        publishedBy: userResult.user.email,
        fileMetadata: {
          size: publishResult.fileSize,
          lastModified: publishResult.lastModified,
          preview: publishResult.contentPreview
        },
        notifications: {
          sent: endpoints.length,
          successful: notificationResults.filter(r => r.success).length,
          failed: notificationResults.filter(r => !r.success).length,
          results: notificationResults
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in publish-guidance function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to publish guidance content',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});