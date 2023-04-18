// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
}

interface Transaction {
  account_id: number
  customer_id: number
  purchase_order: String
  tax: String
  segment_id: number
  supplier_id: number
  reference: String
  description: String
  dpp: number
  ppn: number
  pph: number
  total: number
  debit: number
  credit: number
  remarks: String
  created_by_user_id: number
}

async function getTransaction(supabaseClient: SupabaseClient, id: string) {
  const { data: transaction, error } = await supabaseClient.from('transactions').select('*').eq('id', id)
  if (error) throw error

  return new Response(JSON.stringify(transaction), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
}

async function getAllTransactions(supabaseClient: SupabaseClient) {
  const { data: transactions, error } = await supabaseClient.from('transactions').select('*, account_id:accounts(id, name), customer_id:customers(id, name), segment_id:segments(id, name), supplier_id:suppliers(id, name), created_by_user_id:users(id, username)')
  if (error) throw error

  return new Response(JSON.stringify(transactions), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
}

async function deleteTransaction(supabaseClient: SupabaseClient, id: string) {
  const { error } = await supabaseClient.from('transactions').delete().eq('id', id)
  if (error) throw error

  return new Response(JSON.stringify(
    {
      "success": true,
      "message": "transaction deleted successfully",
    }
  ), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
}

async function updateTransaction(supabaseClient: SupabaseClient, id: string, transaction: Transaction) {
  const { error } = await supabaseClient.from('transactions').update(transaction).eq('id', id)
  if (error) throw error

  return new Response(JSON.stringify({ transaction }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
}

async function createTransaction(supabaseClient: SupabaseClient, transaction: Transaction) {
  const { error } = await supabaseClient.from('transactions').insert(transaction)
  if (error) throw error

  return new Response(JSON.stringify(
    {
      "success": true,
      "message": "transaction created successfully",
    }
  ), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
}

serve(async (req) => {
  const { url, method } = req

  // This is needed if you're planning to invoke your function from a browser.
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user.
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('URL') ?? '',
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get('ANON_KEY') ?? '',
      // Create client with Auth context of the user that called the function.
      // This way your row-level-security (RLS) policies are applied.
      // { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // For more details on URLPattern, check https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API
    const transactionPattern = new URLPattern({ pathname: '/transactions/:id' })
    const matchingPath = transactionPattern.exec(url)
    const id = matchingPath ? matchingPath.pathname.groups.id : null

    let transaction = null
    if (method === 'POST' || method === 'PUT') {
      const body  = await req.json()
      transaction = body
    }

    // call relevant method based on method and id
    switch (true) {
      case id && method === 'GET':
        return getTransaction(supabaseClient, id as string)
      case id && method === 'PUT':
        return updateTransaction(supabaseClient, id as string, transaction)
      case id && method === 'DELETE':
        return deleteTransaction(supabaseClient, id as string)
      case method === 'POST':
        return createTransaction(supabaseClient, transaction)
      case method === 'GET':
        return getAllTransactions(supabaseClient)
      default:
        return getAllTransactions(supabaseClient)
    }
  } catch (error) {
    console.error(error)

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'


// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
