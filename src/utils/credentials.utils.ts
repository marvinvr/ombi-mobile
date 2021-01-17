export function hasProtocol(url: string): boolean {
    return !(url.indexOf('https://') == -1 && url.indexOf('http://') == -1)
}

export function removeTrailingSlash(url: string): string {
    if(url.charAt(url.length-1) == '/')
        return url.substring(0, url.length-1);
    return url;
}