export const hasProtocol = (url: string): boolean => !(url.indexOf('https://') === -1 && url.indexOf('http://') === -1);

export const removeTrailingSlash = (url: string): string => {
    if(url.charAt(url.length-1) === '/')
        {return url.substring(0, url.length-1);}
    return url;
};

export const replaceBackslashes = (url: string): string => url.replace('\\', '/');
