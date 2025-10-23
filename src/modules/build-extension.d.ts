// Type declarations for extension build modules that may not be installed
declare module 'wxt' {
  export interface ResolvedConfig {
    root: string
    outDir: string
    logger: any
    alias: Record<string, string>
    manifest: any
    command: string
  }

  export interface WxtDevServer {
    origin: string
  }

  export interface Wxt {
    config: ResolvedConfig
    server?: WxtDevServer
    hook: (name: string, handler: (...args: any[]) => any) => void
  }
}

declare module 'wxt/modules' {
  export function defineWxtModule(config: any): any
  export function addViteConfig(wxt: any, config: any): void
}

declare module 'linkedom' {
  export function parseHTML(html: string): any
}
