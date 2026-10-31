declare module "xss" {
  type CssOptions = {
    whiteList: Record<string, boolean | RegExp>;
  };

  type FilterOptions = {
    whiteList: Record<string, string[]>;
    stripIgnoreTag: boolean;
    stripIgnoreTagBody: string[];
    css: CssOptions;
  };

  function xss(html: string, options: FilterOptions): string;

  export default xss;
}
