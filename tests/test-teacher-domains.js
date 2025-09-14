/**
 * Test script to verify teacher domain persistence
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jfolpnyipoocflcrachg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb2xwbnlpcG9vY2ZsY3JhY2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNTQxOTcsImV4cCI6MjA2ODkzMDE5N30.Z1vfzimy6x_B6cMLKeMS_91UXctePwSgMJsIgwQPrzg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTeacherDomains() {
  const teacherId = '569f2bd7-f7fd-4ffd-922d-1009efa16fb3';
  
  console.log('Testing teacher domain persistence...\n');
  
  try {
    // 1. Check current domains assigned to teacher
    console.log('1. Fetching current teacher domains...');
    const { data: currentDomains, error: fetchError } = await supabase
      .from('teacher_domains')
      .select(`
        id,
        domain_id,
        is_primary,
        certification_level,
        created_at
      `)
      .eq('teacher_id', teacherId);
    
    if (fetchError) {
      console.error('Error fetching domains:', fetchError);
      return;
    }
    
    console.log(`Found ${currentDomains?.length || 0} domains assigned to teacher:`);
    currentDomains?.forEach(td => {
      console.log(`  - Domain ID: ${td.domain_id}, Primary: ${td.is_primary}, Level: ${td.certification_level}`);
    });
    
    // 2. Get available domains
    console.log('\n2. Fetching available domains...');
    const { data: availableDomains, error: domainsError } = await supabase
      .from('domains')
      .select('id, name, status')
      .eq('status', 'active')
      .limit(5);
    
    if (domainsError) {
      console.error('Error fetching available domains:', domainsError);
      return;
    }
    
    console.log(`Found ${availableDomains?.length || 0} available domains:`);
    availableDomains?.forEach(d => {
      console.log(`  - ${d.name} (${d.id})`);
    });
    
    // 3. Check if we can query with the join
    console.log('\n3. Testing join query (as used in EditTeacherPage)...');
    const { data: joinedData, error: joinError } = await supabase
      .from('teacher_domains')
      .select(`
        domain_id,
        is_primary,
        certification_level,
        domains:domain_id (
          id,
          name
        )
      `)
      .eq('teacher_id', teacherId);
    
    if (joinError) {
      console.error('Error with join query:', joinError);
      console.error('Query details:', joinError.details, joinError.hint);
    } else {
      console.log('Join query successful!');
      console.log('Joined data:', JSON.stringify(joinedData, null, 2));
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testTeacherDomains();