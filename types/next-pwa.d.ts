declare module 'next-pwa' {
  import { NextConfig } from 'next'
  
  interface PWAConfig {
    dest?: string
    disable?: boolean
    register?: boolean
    scope?: string
    sw?: string
    skipWaiting?: boolean
    runtimeCaching?: any[]
    buildExcludes?: string[]
    publicExcludes?: string[]
  }

  function withPWA(config: PWAConfig): (config: NextConfig) => NextConfig
  
  export = withPWA
}
