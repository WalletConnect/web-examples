module.exports = {
  reactStrictMode: true,
  webpack(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false
    }
    // needed for tiny-secp256k1 package
    config.experiments.asyncWebAssembly = true
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async'
    })
    return config
  }
}
