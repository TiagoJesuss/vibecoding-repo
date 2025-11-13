import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting PDF text extraction...');
    
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      console.error('No file provided or invalid file type');
      return new Response(
        JSON.stringify({ error: 'No PDF file provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Processing PDF file: ${file.name}, size: ${file.size} bytes`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);

    console.log('Extracting text from PDF using basic extraction...');
    
    // Convert PDF bytes to string for basic text extraction
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let extractedText = '';
    
    // Try to extract text by looking for text streams in PDF
    // This is a simple approach - PDF structure has text between "BT" and "ET" markers
    const pdfString = decoder.decode(pdfBytes);
    
    // Extract text content from PDF streams
    // Look for text objects between BT (Begin Text) and ET (End Text)
    const textMatches = pdfString.match(/BT(.*?)ET/gs);
    
    if (textMatches) {
      for (const match of textMatches) {
        // Extract text from Tj or TJ operators
        const tjMatches = match.match(/\((.*?)\)/g);
        if (tjMatches) {
          for (const tj of tjMatches) {
            // Remove parentheses and add to extracted text
            const text = tj.slice(1, -1)
              .replace(/\\n/g, '\n')
              .replace(/\\r/g, '\r')
              .replace(/\\t/g, '\t')
              .replace(/\\\\/g, '\\')
              .replace(/\\\(/g, '(')
              .replace(/\\\)/g, ')');
            extractedText += text + ' ';
          }
        }
      }
    }
    
    // Clean up extracted text
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .trim();
    
    // Estimate page count from PDF structure
    const pageMatches = pdfString.match(/\/Type\s*\/Page[^s]/g);
    const pageCount = pageMatches ? pageMatches.length : 1;
    
    console.log(`Successfully extracted ${extractedText.length} characters from PDF`);
    console.log(`Estimated ${pageCount} pages`);

    if (extractedText.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No text could be extracted from PDF. The PDF might be image-based or encrypted.',
          success: false 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        text: extractedText,
        pages: pageCount,
        info: {
          extracted: true,
          method: 'basic_text_extraction'
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: 'Failed to extract text from PDF',
        details: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
