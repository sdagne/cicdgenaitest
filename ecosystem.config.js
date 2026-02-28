module.exports = {
    apps: [
        {
            name: 'cicd-demo-app',
            script: 'index.js',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env_dev: {
                NODE_ENV: 'development',
                PORT: 3001
            },
            env_uat: {
                NODE_ENV: 'uat',
                PORT: 3002
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3003
            }
        }
    ]
};
