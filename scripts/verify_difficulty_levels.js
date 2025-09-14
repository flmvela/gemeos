#!/usr/bin/env node

/**
 * Script to verify the current state of difficulty levels in the database
 * Run this before and after the migration to ensure data integrity
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableExists(tableName) {
  const { data, error } = await supabase
    .rpc('table_exists', { table_name: tableName })
    .single();
  
  if (error) {
    // If the function doesn't exist, try a direct query
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName);
    
    return tables && tables.length > 0;
  }
  
  return data?.exists || false;
}

async function verifyDifficultyLevels() {
  console.log('🔍 Verifying Difficulty Level Configuration\n');
  console.log('=' .repeat(60));

  try {
    // 1. Check if tables exist
    console.log('\n📊 Table Existence Check:');
    
    const hasOldTable = await checkTableExists('difficulty_level_labels');
    const hasNewTable = await checkTableExists('domain_difficulty_levels');
    
    console.log(`  ✓ difficulty_level_labels: ${hasOldTable ? 'EXISTS' : 'NOT FOUND'}`);
    console.log(`  ✓ domain_difficulty_levels: ${hasNewTable ? 'EXISTS' : 'NOT FOUND'}`);

    // 2. Check domain_difficulty_levels data
    if (hasNewTable) {
      console.log('\n📊 Domain Difficulty Levels:');
      
      const { data: domainLevels, error: dlError } = await supabase
        .from('domain_difficulty_levels')
        .select(`
          id,
          domain_id,
          level_number,
          level_name,
          domains!inner(name)
        `)
        .order('domain_id', { ascending: true })
        .order('level_number', { ascending: true });

      if (dlError) {
        console.error('  ❌ Error fetching domain difficulty levels:', dlError.message);
      } else {
        // Group by domain
        const byDomain = {};
        domainLevels.forEach(level => {
          const domainName = level.domains?.name || 'Unknown';
          if (!byDomain[domainName]) {
            byDomain[domainName] = [];
          }
          byDomain[domainName].push(level);
        });

        Object.entries(byDomain).forEach(([domain, levels]) => {
          console.log(`\n  Domain: ${domain}`);
          console.log(`    Levels: ${levels.length}`);
          console.log(`    Range: ${levels[0]?.level_number} - ${levels[levels.length - 1]?.level_number}`);
        });
      }
    }

    // 3. Check concepts difficulty configuration
    console.log('\n📊 Concepts Difficulty Configuration:');
    
    // Check if concepts have difficulty_level column
    const { data: conceptsWithNumeric, error: cnError } = await supabase
      .from('concepts')
      .select('id, name, difficulty_level')
      .not('difficulty_level', 'is', null)
      .limit(5);

    if (!cnError && conceptsWithNumeric && conceptsWithNumeric.length > 0) {
      console.log(`  ✓ Concepts with numeric difficulty_level: ${conceptsWithNumeric.length}+ found`);
      console.log('    Sample:', conceptsWithNumeric.map(c => `${c.name} (Level ${c.difficulty_level})`).join(', '));
    } else {
      console.log('  ℹ️ No concepts with numeric difficulty_level found');
    }

    // Check if concepts have difficulty_level_id column
    const { data: conceptsWithFK, error: cfkError } = await supabase
      .from('concepts')
      .select(`
        id,
        name,
        difficulty_level_id,
        domain_difficulty_levels(level_number, level_name)
      `)
      .not('difficulty_level_id', 'is', null)
      .limit(5);

    if (!cfkError && conceptsWithFK && conceptsWithFK.length > 0) {
      console.log(`  ✓ Concepts with difficulty_level_id FK: ${conceptsWithFK.length}+ found`);
      console.log('    Sample:', conceptsWithFK.map(c => 
        `${c.name} (${c.domain_difficulty_levels?.level_name || 'Unknown'})`
      ).join(', '));
    } else {
      console.log('  ℹ️ No concepts with difficulty_level_id foreign key found');
    }

    // 4. Check classes difficulty configuration
    console.log('\n📊 Classes Difficulty Configuration:');
    
    const { data: classesData, error: classError } = await supabase
      .from('classes')
      .select('id, name, difficulty_level, difficulty_level_id')
      .limit(5);

    if (!classError && classesData && classesData.length > 0) {
      const withNumeric = classesData.filter(c => c.difficulty_level !== null).length;
      const withFK = classesData.filter(c => c.difficulty_level_id !== null).length;
      
      console.log(`  ✓ Classes found: ${classesData.length}`);
      console.log(`    With numeric difficulty_level: ${withNumeric}`);
      console.log(`    With difficulty_level_id FK: ${withFK}`);
    } else {
      console.log('  ℹ️ No classes found or error accessing classes table');
    }

    // 5. Check class_difficulty_levels junction table
    console.log('\n📊 Class Difficulty Levels (Junction Table):');
    
    const { data: classDiffLevels, error: cdlError } = await supabase
      .from('class_difficulty_levels')
      .select('*')
      .limit(5);

    if (!cdlError && classDiffLevels) {
      console.log(`  ✓ Class-Difficulty associations: ${classDiffLevels.length} found`);
    } else {
      console.log('  ℹ️ No class-difficulty associations found or table does not exist');
    }

    // 6. Summary and recommendations
    console.log('\n' + '=' .repeat(60));
    console.log('📋 SUMMARY & RECOMMENDATIONS:\n');

    if (hasOldTable && hasNewTable) {
      console.log('⚠️  Both old and new difficulty tables exist.');
      console.log('   → Run the consolidation migration to merge data.');
    } else if (hasOldTable && !hasNewTable) {
      console.log('⚠️  Only old difficulty_level_labels table exists.');
      console.log('   → Need to create domain_difficulty_levels table first.');
    } else if (!hasOldTable && hasNewTable) {
      console.log('✅ Only new domain_difficulty_levels table exists.');
      console.log('   → System is already using the consolidated structure.');
    } else {
      console.log('❌ No difficulty level tables found.');
      console.log('   → Need to run initial setup migrations.');
    }

    console.log('\n' + '=' .repeat(60));

  } catch (error) {
    console.error('\n❌ Error during verification:', error.message);
    process.exit(1);
  }
}

// Run the verification
verifyDifficultyLevels()
  .then(() => {
    console.log('\n✅ Verification complete!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });