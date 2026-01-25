import{d as n,a as K,e as O,w as D,j as a,M as Y,f as $,S as N,h as T,O as B}from"./chunk-JMJ3UQ3L-BiyHQKbA.js";import{C as g}from"./index-CXVg1yYe.js";import"./index-BC2DTU4s.js";import"./index-BK_IAdkX.js";var s=e=>`🔒 Clerk: ${e.trim()}

For more info, check out the docs: https://clerk.com/docs,
or come say hi in our discord server: https://clerk.com/discord
`,h=`Use 'rootAuthLoader' as your root loader. Then, add <ClerkProvider> to your app.
Example:

import { rootAuthLoader } from '@clerk/react-router/ssr.server'
import { ClerkProvider } from '@clerk/react-router'

export async function loader(args: Route.LoaderArgs) {
  return rootAuthLoader(args)
}

export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <ClerkProvider loaderData={loaderData}>
      <Outlet />
    </ClerkProvider>
  )
}
`,J=s(`
You're trying to pass an invalid object in "<ClerkProvider clerkState={...}>".

${h}
`),m=s(`
Looks like you didn't pass 'clerkState' to "<ClerkProvider clerkState={...}>".

${h}
`);s(`
You're calling 'getAuth()' from a loader, without providing the loader args object.
Example:

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args)

  // Your code here
}
`);s(`
You're returning an invalid response from the 'rootAuthLoader' inside root.tsx.
You can only return plain objects, Responses created using the React Router 'data()'helper or
custom redirect 'Response' instances (status codes in the range of 300 to 400).
If you want to return a primitive value or an array, you can always wrap the response with an object.

Example:

export async function loader(args: Route.LoaderArgs) {
  return rootAuthLoader(args, async ({ auth }) => {
    const { userId } = auth;
    const posts = await database.getPostsByUserId(userId);

    return { data: posts }
    // Or
    return data(posts, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  })
}
`);s(`
A secretKey must be provided in order to use SSR and the exports from @clerk/react-router/api.');
If your runtime supports environment variables, you can add a CLERK_SECRET_KEY variable to your config.
Otherwise, you can pass a secretKey parameter to rootAuthLoader or getAuth.
`);s("Missing domain and proxyUrl. A satellite application needs to specify a domain or a proxyUrl");s(`
Invalid signInUrl. A satellite application requires a signInUrl for development instances.
Check if signInUrl is missing from your configuration or if it is not an absolute URL.`);var V=s(`
You're trying to use Clerk in React Router SPA Mode without providing a Publishable Key.
Please provide the publishableKey prop on the <ClerkProvider> component.

Example:

<ClerkProvider publishableKey={PUBLISHABLE_KEY}>
`),q=`To use the new middleware system, you need to:

1. Enable the 'v8_middleware' future flag in your config:

// react-router.config.ts
export default {
  future: {
    v8_middleware: true,
  },
} satisfies Config;

2. Install the clerkMiddleware:

import { clerkMiddleware, rootAuthLoader } from '@clerk/react-router/server'
import { ClerkProvider } from '@clerk/react-router'

export const middleware: Route.MiddlewareFunction[] = [clerkMiddleware()]

export const loader = (args: Route.LoaderArgs) => rootAuthLoader(args)

export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <ClerkProvider loaderData={loaderData}>
      <Outlet />
    </ClerkProvider>
  )
}
`;s(`
'"clerkMiddleware()" not detected.

${q}
`);function z(e){(!e||!e.__internal_clerk_state)&&console.warn(m)}function H(e){if(!e)throw new Error(m);if(e&&!e.__internal_clerk_state)throw new Error(J)}function G(e){if(!e||typeof e!="string")throw new Error(V)}var v=()=>{var e;if(typeof window<"u"&&typeof((e=window.__reactRouterContext)==null?void 0:e.isSpaMode)<"u")return window.__reactRouterContext.isSpaMode},_=n.createContext(void 0);_.displayName="ClerkReactRouterOptionsCtx";var Q=e=>{const{children:o,options:r}=e;return n.createElement(_.Provider,{value:{value:r}},o)},W=()=>{const e=K(),o=O(),r=n.useRef([]),i=()=>{r.current.forEach(t=>t()),r.current.splice(0,r.current.length)};return n.useEffect(()=>{i()},[o]),(t,d)=>new Promise(u=>{r.current.push(u),e(t,d)})},X={name:"@clerk/react-router",version:"2.3.7"},c={current:void 0};function Z({children:e,...o}){const r=W(),i=v();n.useEffect(()=>{c.current=r},[r]);const{clerkState:t,...d}=o;g.displayName="ReactClerkProvider",typeof i<"u"&&!i&&H(t);const{__clerk_ssr_state:u,__publishableKey:k,__proxyUrl:y,__domain:w,__isSatellite:R,__clerk_debug:b,__signInUrl:U,__signUpUrl:x,__afterSignInUrl:S,__afterSignUpUrl:C,__signInForceRedirectUrl:E,__signUpForceRedirectUrl:P,__signInFallbackRedirectUrl:A,__signUpFallbackRedirectUrl:I,__clerkJSUrl:M,__clerkJSVersion:L,__telemetryDisabled:j,__telemetryDebug:F}=(t==null?void 0:t.__internal_clerk_state)||{};n.useEffect(()=>{typeof i<"u"&&!i&&z(t)},[]),n.useEffect(()=>{window.__clerk_debug=b},[]);const f={publishableKey:k,proxyUrl:y,domain:w,isSatellite:R,signInUrl:U,signUpUrl:x,afterSignInUrl:S,afterSignUpUrl:C,signInForceRedirectUrl:E,signUpForceRedirectUrl:P,signInFallbackRedirectUrl:A,signUpFallbackRedirectUrl:I,clerkJSUrl:M,clerkJSVersion:L,telemetry:{disabled:j,debug:F}};return n.createElement(Q,{options:f},n.createElement(g,{routerPush:p=>{var l;return(l=c.current)==null?void 0:l.call(c,p)},routerReplace:p=>{var l;return(l=c.current)==null?void 0:l.call(c,p,{replace:!0})},initialState:u,sdkMetadata:X,...f,...d},e))}var ee=({children:e,loaderData:o,...r})=>{let i;const t=v();return!t&&(o!=null&&o.clerkState)&&(i=o.clerkState),typeof t<"u"&&t&&G(r.publishableKey),n.createElement(Z,{...r,clerkState:i},e)};const ne=()=>[{rel:"preconnect",href:"https://fonts.googleapis.com"},{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"},{rel:"stylesheet",href:"https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"}];function ie({children:e}){return a.jsxs("html",{lang:"ja",children:[a.jsxs("head",{children:[a.jsx("meta",{charSet:"utf-8"}),a.jsx("meta",{name:"viewport",content:"width=device-width, initial-scale=1"}),a.jsx(Y,{}),a.jsx($,{})]}),a.jsxs("body",{children:[e,a.jsx(N,{}),a.jsx(T,{})]})]})}const se=D(function({loaderData:o}){return a.jsx(ee,{loaderData:o,signUpFallbackRedirectUrl:"/",signInFallbackRedirectUrl:"/",children:a.jsx(B,{})})});export{ie as Layout,se as default,ne as links};
