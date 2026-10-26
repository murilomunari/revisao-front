export function getProductsUrl(search: string): string {
  const query = search.trim();
  const endpoint = query ? "/products/search" : "/products";
  const url = new URL(endpoint, "https://dummyjson.com");
  url.searchParams.set("limit", "15");
  if (query) url.searchParams.set("q", query);
  return url.toString();
}
