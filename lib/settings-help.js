// Describe CLI arguments
export default {
    apiPort: 'The port number for the API server.',
    colorScheme: 'The color scheme for the page and product. Can be "system", "light" or "dark".',
    codePort: 'The port number for the code server.',
    codeSecurePort: 'The HTTPS port number for the code server.',
    codeWatch: 'Whether to watch changes in the code and automatically reload the page.',
    compileOnDemand: 'Experimental feature to compile Highcharts bundles without having to run gulp in the main repo.',
    crtFile: 'Set the path to the crt certificate file. Provide for SSL. If a relative path is provided then it will be relative to the current working directory.',
    emulateKarma: 'Run the tests and side-by-side comparison in a Karma-like environment. Loads a lot of bundle files instead of those defined in demo.html.',
    highchartsDir: 'Set the path to the highcharts repository directory. If a relative path is provided then it will be relative to the current working directory.',
    localOnly: 'Strict local mode for hardened environments like CircleCI.',
    pemFile: 'Set the path to the pem certificate file. Provide for SSL. If a relative path is provided then it will be relative to the current working directory.',
    proxy: 'Whether to set up proxies for the servers.',
    topdomain: 'The domain name for the proxies. E.g code.highcharts.<topdomain>.',
    useESModules: 'When enabled, samples are rewritten to load ES6 modules for faster debugging. Run `npx tsc -b ts --watch` on the main repo.',
    useMinifiedCode: 'Whether to use minified code files. Run `gulp compile` in the main repo first to minify the files.',
    utilsPort: 'The port number for the utils server.'
};