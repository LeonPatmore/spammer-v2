module.exports = function(config) {
    config.set({
        mutate: ['src/**/*.js', '!src/test/**/*'],
        mutator: 'javascript',
        packageManager: 'npm',
        reporters: ['html'],
        testRunner: 'jest',
        coverageAnalysis: 'off',
        jest: {
            enableFindRelatedTests: false,
        },
        thresholds: {
            high: 80,
            low: 60,
            break: 50,
        },
    });
};
