module.exports = function(config) {
    config.set({
        mutate: [
            'src/**/*.js',
            '!src/cluster/leader/spammer-leader.js',
            '!src/cluster/follower/spammer-follower.js',
            '!src/test/**/*',
        ],
        mutator: 'javascript',
        packageManager: 'npm',
        reporters: ['html'],
        testRunner: 'jest',
        coverageAnalysis: 'off',
        jest: {
            enableFindRelatedTests: true,
        },
        thresholds: {
            high: 80,
            low: 60,
            break: 50,
        },
    });
};
