import { WG_ENV } from '../utils/config';
import { getRequestHeaders } from 'h3';

function joinPath(...segments: string[]): string {
  const result =segments
    .join('/')
    .replace(/\/+/g, '/'); // Remove duplicate slashes
    
  return result === '' ? '/' : result; // empty result becomes '/'
}

/* First setup of wg-easy */
export default defineEventHandler(async (event) => {
  try {

    //SERVER_DEBUG('------->defineEventHandler'); // for debugging

    const headers = getRequestHeaders(event);
    //SERVER_DEBUG('All headers:', headers); // for debugging
    const prefix = headers['x-forwarded-prefix'] || '/';
    
    const url = getRequestURL(event);     

    const config = useRuntimeConfig();
    //SERVER_DEBUG(`app.baseURL=${config.app.baseURL}`); // for debugging

    const cache_control = headers['cache-control'] || '';
    if (cache_control == '') // skip health-check requests
    {
      if (prefix !== config.app.baseURL)
      {      
        SERVER_DEBUG(`!!! Misconfiguration: X-Forwarded-Prefix=${prefix}, build-in prefix (app.baseURL)=${config.app.baseURL}\n`);   
      }               
    }
    /*else
    {
      SERVER_DEBUG('cache control request:', url.pathname); // for debugging      
    }*/

    if (prefix !== '/')
    {
      if (!url.pathname.startsWith(prefix))
      {     
        SERVER_DEBUG(`Incorrect URL: prefix=${prefix}, url.pathname=${url.pathname}\n`);   
        return; // incorrect URL
      }
    }
    
    // remove prefix from URL
    const normalizedPath0 = prefix === '/' ? url.pathname : url.pathname.replace(new RegExp(`^${prefix}`), '');
    const normalizedPath = normalizedPath0 === '' ? '/' : normalizedPath0; 
        
    // User can't be logged in, and public routes can be accessed whenever
    if (normalizedPath.startsWith('/api/')) {
      return;
    }

    const parsedSetup = normalizedPath.match(/\/setup\/(\d+)/);

    // adding prefix to all sendRedirect here
    const { step, done } = await Database.general.getSetupStep();
    if (!done) {    
      
      if (!parsedSetup) {
            return sendRedirect(event, joinPath(prefix,`/setup/1`), 302);
      }
     
      const [_, currentSetup] = parsedSetup;

      if (step.toString() === currentSetup) {
        return;
      }
     
      return sendRedirect(event, joinPath(prefix,`/setup/${step}`), 302);
    } else {
      // If already set up
      if (!normalizedPath.startsWith('/setup/')) {
        return;
      }

      return sendRedirect(event, joinPath(prefix,'/login'), 302);
    }
  }
  catch (error) {
    // Log the error
    SERVER_DEBUG('API error:', error);    
    
    if (process.env.NODE_ENV === 'development') {
      return createError({
        statusCode: 500,
        statusMessage: 'Internal sever error',
        data: { error: error.message }  // dev only
      });
    } else {
      return createError({
        statusCode: 500,
        statusMessage: 'Internal server error'
      });
    }
  }
});
