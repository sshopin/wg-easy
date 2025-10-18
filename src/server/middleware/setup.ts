import { WG_ENV } from '../utils/config';

function joinPath(...segments: string[]): string {
  const result =segments
    .join('/')
    .replace(/\/+/g, '/'); // Remove duplicate slashes
    
  return result === '' ? '/' : result; // empty result becomes '/'
}

/* First setup of wg-easy */
export default defineEventHandler(async (event) => {
  try {
    const url = getRequestURL(event);
    process.stderr.write(`url.pathname =${url.pathname}\n`);
    
    const prefix = WG_ENV.APP_SUBFOLDER || '/';  // from process.env
    process.stderr.write(`prefix=${prefix}\n`);

    const config = useRuntimeConfig()  
    const baseURL = config.public.baseURL;
    process.stderr.write(`baseURL=${baseURL}\n`);

    if (prefix !== '/')
    {
      if (!url.pathname.startsWith(prefix))
      {
        process.stderr.write(`incorrect URL\n`);
        return; // incorrect URL
      }
    }
    
    // remove prefix
    const normalizedPath0 = prefix === '/' ? url.pathname : url.pathname.replace(new RegExp(`^${prefix}`), '');
    const normalizedPath = normalizedPath0 === '' ? '/' : normalizedPath0; 
    process.stderr.write(`normalizedPath =${normalizedPath }\n`);
        
    // User can't be logged in, and public routes can be accessed whenever
    if (normalizedPath.startsWith('/api/')) {
      return;
    }

    const parsedSetup = normalizedPath.match(/\/setup\/(\d+)/);

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
    // Logging error
    console.error('API error:', error);
    process.stderr.write(`API error: ${error}\n`);
        
    
    // Возвращаем дружелюбное сообщение клиенту (не показываем стек в проде)
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
