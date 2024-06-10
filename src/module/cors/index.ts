
export type CorsHeaders = {
    'Access-Control-Allow-Origin': string;
    'Access-Control-Allow-Headers': string;
}

const CORS_HEADERS_DEFAULT:Readonly<CorsHeaders> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
} as const;
Object.freeze(CORS_HEADERS_DEFAULT);

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS';

export function getCorsHeadersDefault():CorsHeaders {
    return CORS_HEADERS_DEFAULT;
}

export function respondEarlyToRequest(req: Request, acceptedMethods:HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE'], corsHeaders:CorsHeaders = getCorsHeadersDefault(), ):Response | undefined {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { ...corsHeaders } })
    } else if( !acceptedMethods.includes(req.method as HttpMethod) ) {
        return new Response(JSON.stringify({'error': 'Method not allowed'}), { headers: { ...corsHeaders }, status: 405 });
    }
    return undefined;
}