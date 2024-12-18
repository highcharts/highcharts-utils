import globals from 'globals';

// Fails ESLint: 'AudioWorkletGlobalScope ' has trailing whitespace
delete globals.browser['AudioWorkletGlobalScope '];

export default [{
    languageOptions: {
        ecmaVersion: 2025,
        sourceType: 'module',
        globals: {
            ...globals.browser,
            ...globals.node
        }
    },
    rules: {
        'no-undef': 2,
        'no-unused-vars': [
            'error',
            {
                caughtErrors: 'none'
            }
        ]
    },
    ignores: [
        'public/javascripts/vendor'
    ]
}];