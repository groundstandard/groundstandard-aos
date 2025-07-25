import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SAMPLE-DATA] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting sample data creation");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const results = {
      academies: 0,
      students: 0,
      instructors: 0,
      classes: 0,
      schedules: 0,
      membershipPlans: 0,
      inventory: 0,
      payments: 0
    };

    // Create sample academy
    const { data: academyData, error: academyError } = await supabaseClient
      .from('academies')
      .upsert({
        name: 'Elite Martial Arts Academy',
        description: 'Premier martial arts training facility with expert instructors',
        address: '123 Main Street, New York, NY 10001',
        phone: '(555) 123-4567',
        email: 'info@elitemartialarts.com',
        city: 'New York',
        state: 'NY',
        zipcode: '10001',
        website_url: 'https://elitemartialarts.com',
        is_setup_complete: true
      }, { onConflict: 'name' })
      .select()
      .single();

    if (academyError) {
      logStep("Academy creation error", academyError);
    } else {
      results.academies = 1;
      logStep("Created academy", academyData?.id);

      // Create sample membership plans
      const membershipPlans = [
        {
          name: 'Basic Monthly',
          description: 'Access to 8 classes per month',
          price_cents: 9900,
          billing_frequency: 'monthly',
          max_classes_per_week: 2,
          is_active: true
        },
        {
          name: 'Premium Monthly',
          description: 'Unlimited classes plus equipment rental',
          price_cents: 15900,
          billing_frequency: 'monthly',
          max_classes_per_week: 999,
          is_active: true
        },
        {
          name: 'Student Package',
          description: 'Discounted rate for students',
          price_cents: 7900,
          billing_frequency: 'monthly',
          max_classes_per_week: 2,
          is_active: true
        }
      ];

      const { data: planData, error: planError } = await supabaseClient
        .from('membership_plans')
        .upsert(membershipPlans, { onConflict: 'name' })
        .select();

      if (!planError) {
        results.membershipPlans = planData?.length || 0;
        logStep("Created membership plans", results.membershipPlans);
      }

      // Create sample classes
      const sampleClasses = [
        {
          name: 'Beginner Karate',
          description: 'Introduction to basic karate techniques and forms',
          max_students: 15,
          duration_minutes: 60,
          skill_level: 'beginner',
          age_group: 'all',
          is_active: true
        },
        {
          name: 'Advanced Kickboxing',
          description: 'High-intensity kickboxing for experienced practitioners',
          max_students: 12,
          duration_minutes: 75,
          skill_level: 'advanced',
          age_group: 'adults',
          is_active: true
        },
        {
          name: 'Kids Martial Arts',
          description: 'Fun and engaging martial arts for children',
          max_students: 20,
          duration_minutes: 45,
          skill_level: 'beginner',
          age_group: 'youth',
          is_active: true
        },
        {
          name: 'Mixed Martial Arts',
          description: 'Comprehensive MMA training',
          max_students: 10,
          duration_minutes: 90,
          skill_level: 'intermediate',
          age_group: 'adults',
          is_active: true
        }
      ];

      const { data: classData, error: classError } = await supabaseClient
        .from('classes')
        .upsert(sampleClasses, { onConflict: 'name' })
        .select();

      if (!classError && classData) {
        results.classes = classData.length;
        logStep("Created classes", results.classes);

        // Create schedules for classes
        const schedules = [
          // Beginner Karate - Mon/Wed/Fri 6PM
          { class_id: classData[0].id, day_of_week: 1, start_time: '18:00', end_time: '19:00' },
          { class_id: classData[0].id, day_of_week: 3, start_time: '18:00', end_time: '19:00' },
          { class_id: classData[0].id, day_of_week: 5, start_time: '18:00', end_time: '19:00' },
          
          // Advanced Kickboxing - Tue/Thu 7PM
          { class_id: classData[1].id, day_of_week: 2, start_time: '19:00', end_time: '20:15' },
          { class_id: classData[1].id, day_of_week: 4, start_time: '19:00', end_time: '20:15' },
          
          // Kids Martial Arts - Sat 10AM
          { class_id: classData[2].id, day_of_week: 6, start_time: '10:00', end_time: '10:45' },
          
          // MMA - Mon/Wed 8PM
          { class_id: classData[3].id, day_of_week: 1, start_time: '20:00', end_time: '21:30' },
          { class_id: classData[3].id, day_of_week: 3, start_time: '20:00', end_time: '21:30' }
        ];

        const { error: scheduleError } = await supabaseClient
          .from('class_schedules')
          .upsert(schedules, { onConflict: 'class_id,day_of_week,start_time' });

        if (!scheduleError) {
          results.schedules = schedules.length;
          logStep("Created schedules", results.schedules);
        }
      }

      // Create sample inventory items
      const inventoryItems = [
        {
          name: 'White Belt',
          description: 'Standard white belt for beginners',
          category: 'uniforms',
          sku: 'WB-001',
          current_stock: 25,
          min_stock_level: 10,
          max_stock_level: 50,
          unit_cost: 15.00,
          selling_price: 25.00,
          supplier: 'Martial Arts Supply Co.',
          location: 'Storage Room A',
          status: 'active'
        },
        {
          name: 'Training Gloves',
          description: 'Protective gloves for sparring',
          category: 'equipment',
          sku: 'TG-001',
          current_stock: 15,
          min_stock_level: 5,
          max_stock_level: 30,
          unit_cost: 35.00,
          selling_price: 55.00,
          supplier: 'Combat Gear Ltd.',
          location: 'Equipment Rack 1',
          status: 'active'
        },
        {
          name: 'Academy T-Shirt',
          description: 'Official academy branded t-shirt',
          category: 'merchandise',
          sku: 'TS-001',
          current_stock: 40,
          min_stock_level: 15,
          max_stock_level: 100,
          unit_cost: 12.00,
          selling_price: 25.00,
          supplier: 'Custom Apparel Inc.',
          location: 'Retail Display',
          status: 'active'
        }
      ];

      const { error: inventoryError } = await supabaseClient
        .from('inventory')
        .upsert(inventoryItems, { onConflict: 'sku' });

      if (!inventoryError) {
        results.inventory = inventoryItems.length;
        logStep("Created inventory items", results.inventory);
      }
    }

    logStep("Sample data creation completed", results);

    return new Response(JSON.stringify({
      success: true,
      message: "Sample data created successfully",
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logStep("ERROR creating sample data", { message: error.message });
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});