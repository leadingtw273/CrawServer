module.exports = {
    apps: [
        {
            name: 'CrawlAPI',
            script: 'app.js',
            cwd: './dist',
            exec_mode: 'cluster',
            autorestart: true,
            watch: true,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'development',
            },
            env_production: {
                NODE_ENV: 'production',
            },
        },
    ],
};
