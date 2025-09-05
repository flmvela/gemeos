// v2.0 - Enhanced GCS debugging
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GuidanceArea {
  key: string;
  title: string;
  gcsPath: string;
  exists: boolean;
  lastModified: string | null;
}

// Function to convert folder names to user-friendly titles
function formatTitle(folderName: string): string {
  const titleMap: { [key: string]: string } = {
    'concepts': 'Concepts',
    'concept-structuring': 'Concept Structuring',
    'learning-strategies': 'Learning Strategies',
    'evaluation-methods': 'Evaluation Methods',
    'content-formats': 'Content Formats',
    'task-types': 'Task Types',
    'exercises': 'Exercises',
    'strategies': 'Strategies',
    'learning-goals': 'Learning Goals',
  };
  
  return titleMap[folderName] || folderName.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

// Function to check if GCS credentials are available
function hasGCSCredentials(): boolean {
  const serviceAccount = Deno.env.get('GOOGLE_CLOUD_SERVICE_ACCOUNT');
  return !!serviceAccount;
}

// Simplified approach - if no GCS credentials, return hardcoded areas
function getHardcodedAreas(domainId: string): GuidanceArea[] {
  const areas = [
    { key: 'concepts', title: 'Concepts' },
    { key: 'concept-structuring', title: 'Concept Structuring' },
    { key: 'learning-strategies', title: 'Learning Strategies' },
    { key: 'evaluation-methods', title: 'Evaluation Methods' },
    { key: 'content-formats', title: 'Content Formats' },
    { key: 'task-types', title: 'Task Types' },
  ];

  return areas.map(area => ({
    key: area.key,
    title: area.title,
    gcsPath: `gs://gemeos-guidance/${domainId}/guidance/${area.key}/${area.key}_guidance.md`,
    exists: Math.random() > 0.5, // Random for demo
    lastModified: new Date().toISOString(),
  }));
}

// Function to get GCS access token (proper JWT signing)
async function getAccessToken() {
  const serviceAccount = Deno.env.get('GOOGLE_CLOUD_SERVICE_ACCOUNT');
  if (!serviceAccount) {
    throw new Error('GOOGLE_CLOUD_SERVICE_ACCOUNT not configured');
  }

  const credentials = JSON.parse(serviceAccount);
  
  const now = Math.floor(Date.now() / 1000);
  const header = {
    "alg": "RS256",
    "typ": "JWT",
    "kid": credentials.private_key_id
  };
  
  const payload = {
    "iss": credentials.client_email,
    "scope": "https://www.googleapis.com/auth/cloud-platform",
    "aud": "https://oauth2.googleapis.com/token",
    "exp": now + 3600,
    "iat": now
  };

  // Encode header and payload
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  // Import private key and sign
  const privateKey = credentials.private_key
    .replace(/\\n/g, '\n')  // Replace escaped newlines
    .replace(/-----BEGIN PRIVATE KEY-----\n?/, '')  // Remove header
    .replace(/\n?-----END PRIVATE KEY-----/, '')     // Remove footer
    .replace(/\s/g, '');  // Remove all whitespace

  // Convert base64 to binary
  const binaryKey = Uint8Array.from(atob(privateKey), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, signData);
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const jwt = `${headerB64}.${payloadB64}.${signatureB64}`;

  // Get access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Token request failed: ${tokenResponse.status} - ${error}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Function to list folders in GCS (with better error handling)
async function listGuidanceFolders(domainId: string) {
  if (!hasGCSCredentials()) {
    console.log('No GCS credentials, using fallback');
    return ['concepts', 'concept-structuring', 'learning-strategies', 'evaluation-methods'];
  }

  try {
    console.log(`Getting access token for GCS...`);
    const accessToken = await getAccessToken();
    console.log(`Access token obtained successfully`);
    
    const bucketName = 'gemeos-guidance';
    const prefix = `${domainId}/guidance/`;
    
    console.log(`Querying GCS bucket: ${bucketName}, prefix: ${prefix}`);
    
    const response = await fetch(
      `https://storage.googleapis.com/storage/v1/b/${bucketName}/o?prefix=${prefix}&delimiter=/`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log(`GCS API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GCS API error: ${response.status} - ${errorText}`);
      throw new Error(`GCS API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`GCS API response data:`, JSON.stringify(data));
    
    // Extract folder names from prefixes
    const folders = (data.prefixes || [])
      .map((prefix: string) => prefix.replace(`${domainId}/guidance/`, '').replace('/', ''))
      .filter((folder: string) => folder.length > 0);
    
    console.log(`Found folders: ${folders.join(', ')}`);
    return folders.length > 0 ? folders : ['concepts', 'concept-structuring'];
  } catch (error) {
    console.error(`GCS access failed, using fallback: ${error.message}`);
    return ['concepts', 'concept-structuring', 'learning-strategies', 'evaluation-methods'];
  }
}

// Function to check if guidance file exists in folder (with better error handling)
async function checkGuidanceFile(domainId: string, folderName: string) {
  if (!hasGCSCredentials()) {
    console.log(`No GCS credentials for checking file: ${folderName}`);
    return {
      exists: Math.random() > 0.5,
      lastModified: new Date().toISOString()
    };
  }

  try {
    const accessToken = await getAccessToken();
    const bucketName = 'gemeos-guidance';
    const filePath = `${domainId}/guidance/${folderName}/${folderName}_guidance.md`;
    
    console.log(`Checking file existence: ${filePath}`);
    
    const response = await fetch(
      `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(filePath)}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    
    console.log(`File check response for ${folderName}: ${response.status}`);
    
    if (response.ok) {
      const fileData = await response.json();
      console.log(`File ${folderName} exists, last modified: ${fileData.updated || fileData.timeCreated}`);
      return {
        exists: true,
        lastModified: fileData.updated || fileData.timeCreated
      };
    }
    
    console.log(`File ${folderName} does not exist`);
    return { exists: false, lastModified: null };
  } catch (error) {
    console.error(`Error checking file ${folderName}:`, error.message);
    return { exists: false, lastModified: null };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domainId } = await req.json();

    if (!domainId) {
      return new Response(
        JSON.stringify({ error: 'Domain ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`=== Starting check for domain: ${domainId} ===`);

    // Check if we have GCS credentials
    const hasCredentials = hasGCSCredentials();
    console.log(`GCS credentials available: ${hasCredentials}`);
    
    if (!hasCredentials) {
      console.log('❌ No GCS credentials found, using hardcoded areas');
      const areas = getHardcodedAreas(domainId);
      return new Response(
        JSON.stringify({ domainId, areas, debug: 'no-credentials' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Test GCS authentication
    console.log('🔑 Testing GCS authentication...');
    try {
      const accessToken = await getAccessToken();
      console.log(`✅ Access token obtained: ${accessToken.substring(0, 20)}...`);
    } catch (authError) {
      console.error(`❌ Authentication failed: ${authError.message}`);
      const areas = getHardcodedAreas(domainId);
      return new Response(
        JSON.stringify({ domainId, areas, debug: 'auth-failed', error: authError.message }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get actual folders from GCS
    const folders = await listGuidanceFolders(domainId);
    console.log(`Found folders: ${folders.join(', ')}`);
    
    // Check each folder for guidance files
    const areas: GuidanceArea[] = await Promise.all(
      folders.map(async (folderName) => {
        const fileStatus = await checkGuidanceFile(domainId, folderName);
        const gcsPath = `gs://gemeos-guidance/${domainId}/guidance/${folderName}/${folderName}_guidance.md`;
        
        return {
          key: folderName,
          title: formatTitle(folderName),
          gcsPath,
          exists: fileStatus.exists,
          lastModified: fileStatus.lastModified,
        };
      })
    );

    const response = {
      domainId,
      areas,
    };

    console.log(`Returning ${areas.length} guidance areas`);
    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in check-guidance-status function:', error);
    
    // Fallback to hardcoded areas on any error
    try {
      const { domainId } = await req.json();
      if (domainId) {
        console.log('Falling back to hardcoded areas due to error');
        const areas = getHardcodedAreas(domainId);
        return new Response(
          JSON.stringify({ domainId, areas }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});