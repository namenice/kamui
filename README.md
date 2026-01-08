# kamui

# Migrate DB
docker exec -it prd-kamui-backend npx sequelize-cli db:migrate

# Create Admin
docker exec {container-name} node seedAdmin.js

