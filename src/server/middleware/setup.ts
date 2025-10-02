import { WG_ENV } from '../utils/config';

function joinPath(...segments: string[]): string {
  return segments
    .join('/')
    .replace(/\/+/g, '/') // remove double slashes
    .replace(/^\/$/, '/'); // guarantee that empty remains '/'
}

/* First setup of wg-easy */
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);

  //const prefix = getHeader(event, 'x-forwarded-prefix') || '/';  // doesn't work in dev mode for some reason
  const prefix = WG_ENV.APP_SUBFOLDER || '/';  // get app subfolder prefix from project environment

  // get the path with app subfolder removed
  const normalizedPath = prefix === '/' ? url.pathname : url.pathname.replace(new RegExp(`^${prefix}`), '');
//  process.stderr.write(`normalizedPath=${normalizedPath}\n`); // debug

  if (normalizedPath.startsWith('/api/')) {
//    process.stderr.write('/api/ access 1\n'); // debug
    return;
  }

  const parsedSetup = normalizedPath.match(/\/setup\/(\d+)/);

  const { step, done } = await Database.general.getSetupStep();
  if (!done) {    
    if (!parsedSetup) {
      return sendRedirect(event, joinPath(prefix,`/setup/1`), 302); // add subfolder prefix to Redirect
    }
    const [_, currentSetup] = parsedSetup;

    if (step.toString() === currentSetup) {
      return;
    }
    return sendRedirect(event, joinPath(prefix,`setup/${step}`), 302); // add subfolder prefix to redirect
  } else {
    // If already set up
    if (!normalizedPath.startsWith('/setup/')) {
      return;
    }
    return sendRedirect(event, joinPath(prefix,'/login'), 302); // add subfolder prefix to redirect
  }
});
