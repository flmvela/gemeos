const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jfolpnyipoocflcrachg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb2xwbnlpcG9vY2ZsY3JhY2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNTQxOTcsImV4cCI6MjA2ODkzMDE5N30.Z1vfzimy6x_B6cMLKeMS_91UXctePwSgMJsIgwQPrzg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createPlatformAdmin() {
  console.log('Creating platform admin user admin@gemeos.ai...');
  
  try {
    // First, try to sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'admin@gemeos.ai',
      password: 'Admin2025!',
      options: {
        data: {
          full_name: 'Platform Administrator',
          role: 'platform_admin'
        }
      }
    });
    
    if (signUpError && signUpError.message !== 'User already registered') {
      console.error('Error during signup:', signUpError);
      return;
    }
    
    if (signUpData?.user) {
      console.log('✅ User created successfully:', signUpData.user.id);
      console.log('Note: User may need email confirmation. Check Supabase dashboard.');
    } else {
      console.log('User already exists, trying to sign in...');
      
      // Try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'admin@gemeos.ai',
        password: 'Admin2025!'
      });
      
      if (signInError) {
        console.error('Cannot sign in. The user might exist with a different password.');
        console.error('Error:', signInError.message);
        console.log('\nTo fix this, you need to:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to Authentication > Users');
        console.log('3. Find admin@gemeos.ai');
        console.log('4. Reset the password to: Admin2025!');
        console.log('5. Or delete the user and run this script again');
      } else {
        console.log('✅ Successfully signed in as admin@gemeos.ai');
        console.log('User ID:', signInData.user.id);
        
        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', signInData.user.id)
          .single();
          
        if (!profile) {
          console.log('Creating profile...');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              user_id: signInData.user.id,
              email: 'admin@gemeos.ai',
              full_name: 'Platform Administrator',
              user_type: 'admin',
              role: 'platform_admin'
            });
            
          if (insertError) {
            console.error('Error creating profile:', insertError);
          } else {
            console.log('✅ Profile created');
          }
        } else {
          console.log('Profile already exists');
        }
        
        // Sign out after setup
        await supabase.auth.signOut();
      }
    }
    
    console.log('\n📝 Summary:');
    console.log('Email: admin@gemeos.ai');
    console.log('Password: Admin2025!');
    console.log('Expected redirect: /admin/dashboard');
    console.log('\nNote: The auth.service.ts hardcodes admin@gemeos.ai as platform admin.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createPlatformAdmin();