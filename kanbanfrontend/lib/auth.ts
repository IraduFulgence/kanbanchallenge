const TOKEN_COOKIE = "auth_token";
const TOKEN_AGE = 60 * 60*24*14

export function getToken(): string | null {

    if(typeof document === 'undefined') return null;
    const match = document.cookie
    .split("; ")
    .find((row)=>row.startsWith(`${TOKEN_COOKIE}=`));
    return match ? decodeURIComponent(match.split("=").slice(1).join("=")):null;
}

// set token to be used
export function setToken(token:string):void{

    if(typeof document === "undefined") return;

    const securecookie = window.location.protocol === 'https:'? '; Secure':'';
    document.cookie = `${TOKEN_COOKIE}= ${encodeURIComponent(token)}; path=/; max-age=${TOKEN_AGE}; samesite=lax${securecookie}`;
}
// clear token stored in cookies
export function clearToken(): void {
  if (typeof document === "undefined") return;

  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

// check if user is authenticated

export function isAuth(): boolean{
    return getToken() !== null;
}