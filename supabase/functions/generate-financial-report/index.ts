import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { report_type, period_start, period_end, generated_by } = await req.json();

    if (!report_type || !period_start || !period_end) {
      throw new Error("Missing required fields: report_type, period_start, period_end");
    }

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get payments data for the period
    const { data: payments, error: paymentsError } = await supabaseClient
      .from('payments')
      .select(`
        *,
        profiles!payments_student_id_fkey(first_name, last_name, email)
      `)
      .gte('payment_date', period_start)
      .lte('payment_date', period_end)
      .order('payment_date', { ascending: true });

    if (paymentsError) {
      throw new Error(`Error fetching payments: ${paymentsError.message}`);
    }

    // Get late fees for the period
    const { data: lateFees, error: lateFeesError } = await supabaseClient
      .from('late_fees')
      .select('*')
      .gte('created_at', period_start)
      .lte('created_at', period_end);

    if (lateFeesError) {
      console.error("Error fetching late fees:", lateFeesError);
    }

    // Calculate financial metrics
    const totalRevenue = payments?.reduce((sum, p) => {
      return p.status === 'completed' ? sum + Number(p.amount) : sum;
    }, 0) || 0;

    const totalRefunds = payments?.reduce((sum, p) => {
      return p.status === 'refunded' ? sum + Number(p.amount) : sum;
    }, 0) || 0;

    const totalLateFees = lateFees?.reduce((sum, f) => {
      return f.status === 'applied' ? sum + Number(f.late_fee_amount) : sum;
    }, 0) || 0;

    const netRevenue = totalRevenue - totalRefunds + totalLateFees;

    // Payment method breakdown
    const paymentMethodBreakdown = payments?.reduce((acc, payment) => {
      if (payment.status === 'completed') {
        const method = payment.payment_method || 'unknown';
        acc[method] = (acc[method] || 0) + Number(payment.amount);
      }
      return acc;
    }, {} as Record<string, number>) || {};

    // Monthly breakdown
    const monthlyBreakdown: Record<string, any> = {};
    payments?.forEach(payment => {
      if (payment.status === 'completed') {
        const month = payment.payment_date.substring(0, 7); // YYYY-MM
        if (!monthlyBreakdown[month]) {
          monthlyBreakdown[month] = {
            revenue: 0,
            payment_count: 0,
            unique_students: new Set()
          };
        }
        monthlyBreakdown[month].revenue += Number(payment.amount);
        monthlyBreakdown[month].payment_count += 1;
        monthlyBreakdown[month].unique_students.add(payment.student_id);
      }
    });

    // Convert sets to counts
    Object.keys(monthlyBreakdown).forEach(month => {
      monthlyBreakdown[month].unique_students = monthlyBreakdown[month].unique_students.size;
    });

    // Top paying students
    const studentPayments: Record<string, any> = {};
    payments?.forEach(payment => {
      if (payment.status === 'completed') {
        const studentId = payment.student_id;
        if (!studentPayments[studentId]) {
          studentPayments[studentId] = {
            student_name: `${payment.profiles?.first_name} ${payment.profiles?.last_name}`,
            total_amount: 0,
            payment_count: 0
          };
        }
        studentPayments[studentId].total_amount += Number(payment.amount);
        studentPayments[studentId].payment_count += 1;
      }
    });

    const topStudents = Object.values(studentPayments)
      .sort((a: any, b: any) => b.total_amount - a.total_amount)
      .slice(0, 10);

    // Compile report data
    const reportData = {
      summary: {
        total_revenue: totalRevenue,
        total_refunds: totalRefunds,
        total_late_fees: totalLateFees,
        net_revenue: netRevenue,
        total_payments: payments?.filter(p => p.status === 'completed').length || 0,
        total_students: new Set(payments?.map(p => p.student_id)).size,
        average_payment: totalRevenue / (payments?.filter(p => p.status === 'completed').length || 1)
      },
      payment_methods: paymentMethodBreakdown,
      monthly_breakdown: monthlyBreakdown,
      top_students: topStudents,
      late_fees_summary: {
        total_late_fees: totalLateFees,
        late_fee_count: lateFees?.filter(f => f.status === 'applied').length || 0,
        pending_late_fees: lateFees?.filter(f => f.status === 'pending').length || 0
      }
    };

    // Save report to database
    const { data: report, error: reportError } = await supabaseClient
      .from('financial_reports')
      .insert({
        report_type,
        period_start,
        period_end,
        total_revenue: totalRevenue,
        net_income: netRevenue,
        report_data: reportData,
        generated_by
      })
      .select()
      .single();

    if (reportError) {
      throw new Error(`Error saving report: ${reportError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      report_id: report.id,
      report_data: reportData
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error generating financial report:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});