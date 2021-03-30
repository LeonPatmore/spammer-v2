module.exports = {
    postgres: {
        image: 'postgres',
        ports: [5432],
        env: {
            POSTGRES_USER: 'spammer',
            POSTGRES_PASSWORD: 'spammer',
            POSTGRES_DB: 'spammer',
        },
        wait: {
            type: 'text',
            text: 'server started',
        },
    },
};
