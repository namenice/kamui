mkdir -p src/config src/controllers src/middlewares src/models src/routes/v1 src/services src/utils src/validations
touch src/app.js server.js .env .env.example .dockerignore .gitignore Dockerfile docker-compose.yml

# Create table
docker-compose exec app npm run db:migrate

# Register
172.71.7.194:3000/api/v1/auth/register
body 
{"firstName": "Test", "email": "test@test.com", "password": "pass"}