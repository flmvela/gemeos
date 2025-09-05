import fs from 'fs';
import https from 'https';

const SUPABASE_URL = 'https://jfolpnyipoocflcrachg.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb2xwbnlpcG9vY2ZsY3JhY2hnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzM1NDE5NywiZXhwIjoyMDY4OTMwMTk3fQ.ehPKApa5bd-wbnrRKEipZRKM7ZwfYjpN9yiWpdPK-yU';

// First, let's check what tables exist
const checkExistingTables = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `
    });

    const options = {
      hostname: 'jfolpnyipoocflcrachg.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Response:', data);
        resolve(data);
      });
    });

    req.on('error', (e) => {
      console.error('Error:', e.message);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
};

checkExistingTables().then(result => {
  console.log('Existing tables check completed');
}).catch(error => {
  console.error('Failed to check tables:', error);
});