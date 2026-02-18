import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailPayload {
  para: string;
  assunto: string;
  corpo: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { para, assunto, corpo }: EmailPayload = await req.json();

    console.log(`Enviando email para: ${para}`);
    console.log(`Assunto: ${assunto}`);
    console.log(`Corpo: ${corpo}`);

    const data = {
      success: true,
      message: 'Email simulado enviado com sucesso',
      detalhes: {
        para,
        assunto,
        corpo_preview: corpo.substring(0, 100),
      }
    };

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
