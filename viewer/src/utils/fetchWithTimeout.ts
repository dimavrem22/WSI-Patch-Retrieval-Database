export const fetchWithTimeout = async (
    url: string,
    options: RequestInit = {},
    timeout: number = 3000
  ): Promise<Response> => {
    return Promise.race([
      fetch(url, options),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), timeout)
      ),
    ]) as Promise<Response>;
  };