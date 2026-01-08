# kamui

# Deploy Service
docker-compose --env-file .env.prd -f docker-compose.prd.yml up -d --build

# Migrate DB
docker exec -it prd-kamui-backend npx sequelize-cli db:migrate

# Create Admin
docker exec {container-name} node seedAdmin.js

