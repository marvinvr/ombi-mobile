export const isValidUrl = (url: string): boolean => {
    const pattern = new RegExp('^(http|https|ftp):\\/\\/[^ "]+$');
    return pattern.test(url);
};
