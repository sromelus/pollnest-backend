export const getCookieValue = (cookies: string[], cookieName: string) => {
    const cookie = cookies.find(cookie => cookie.startsWith(`${cookieName}=`));

    if (!cookie) return null;

    const pattern = new RegExp(`=(?<${cookieName}>.+?(?=;))`);
    return cookie.match(pattern)?.groups?.[cookieName];
};