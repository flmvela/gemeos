const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jfolpnyipoocflcrachg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb2xwbnlpcG9vY2ZsY3JhY2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNTQxOTcsImV4cCI6MjA2ODkzMDE5N30.Z1vfzimy6x_B6cMLKeMS_91UXctePwSgMJsIgwQPrzg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  // First get the user by email
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'flm.velardi+ta1010@gmail.com');
    
  console.log('User profile:', users);
  
  if (users && users.length > 0) {
    const userId = users[0].user_id;
    
    // Check user_tenants
    const { data: userTenants, error: utError } = await supabase
      .from('user_tenants')
      .select('*, user_roles(*), tenants(*)')
      .eq('user_id', userId);
      
    console.log('User tenants:', JSON.stringify(userTenants, null, 2));
  }
}

checkUser().catch(console.error);
