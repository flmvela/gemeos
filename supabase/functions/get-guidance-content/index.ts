import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GuidanceRequest {
  domainName: string;
  area: string;
  type?: string; // 'guidance' (default) or 'examples'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domainName, area, type = 'guidance' }: GuidanceRequest = await req.json();

    if (!domainName || !area) {
      return new Response(
        JSON.stringify({ error: 'Domain name and area are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse the service account credentials
    const serviceAccountJson = Deno.env.get('GOOGLE_CLOUD_SERVICE_ACCOUNT');
    if (!serviceAccountJson) {
      console.error('GOOGLE_CLOUD_SERVICE_ACCOUNT environment variable not set');
      return new Response(
        JSON.stringify({ error: 'Service account not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const bucketName = 'gemeos-guidance';
    const extension = type === 'examples' ? '.jsonl' : '.md';
    const fileName = type === 'examples' ? `${area}_examples${extension}` : `${area}_guidance${extension}`;
    const objectPath = `${domainName}/guidance/${area}/${fileName}`;

    // Get Google Cloud access token
    const accessToken = await getGoogleCloudAccessToken(serviceAccount);

    // Check if file exists and get its content
    const fileUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(objectPath)}?alt=media`;
    
    console.log(`Attempting to retrieve file: ${objectPath} from bucket: ${bucketName}`);

    const response = await fetch(fileUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (response.status === 404) {
      console.log(`File not found: ${objectPath}`);
      return new Response(
        JSON.stringify({ 
          content: '',
          exists: false 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!response.ok) {
      console.error(`Failed to retrieve file: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve guidance file' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const content = await response.text();
    console.log(`Successfully retrieved file: ${objectPath}, content length: ${content.length}`);

    return new Response(
      JSON.stringify({ 
        content,
        exists: true 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-guidance-content function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function getGoogleCloudAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour

  const jwtPayload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: expiry,
  };

  const jwt = await createJWT(jwtPayload, serviceAccount.private_key);

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to get access token: ${tokenResponse.statusText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function createJWT(payload: any, privateKey: string): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/[+/]/g, c => c === '+' ? '-' : '_').replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/[+/]/g, c => c === '+' ? '-' : '_').replace(/=/g, '');

  const data = `${encodedHeader}.${encodedPayload}`;
  
  // Import the private key
  const keyData = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
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
    new TextEncoder().encode(data)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/[+/]/g, c => c === '+' ? '-' : '_')
    .replace(/=/g, '');

  return `${data}.${encodedSignature}`;
}