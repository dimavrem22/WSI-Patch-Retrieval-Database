export const extractFilename = (wsiPath: string): string => {
    const match = wsiPath.match(/([^\/]+)\.svs$/);
    return match ? match[1] : "";
};