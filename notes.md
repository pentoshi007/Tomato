# All required dependencies and TypeScript typings appear to be correct based on your context.

# Here is the revised (and checked) install command set:

for auth service:
npm install express dotenv googleapis jsonwebtoken mongoose axios cors

npm install --save-dev typescript @types/node @types/express @types/jsonwebtoken @types/mongoose @types/axios @types/cors concurrently

"scripts": {
"build": "tsc ",
"start": "node dist/index.js",
"dev": "concurrently \"tsc -w\" \"node --watch dist/index.js\""
},
npm -D typescript

for frontend: google auth
npm i react-router-dom react-hot-toast axios
npm i @react-oauth/google
npm i react-icons

for restaurant service:
npm i express dotenv mongoose datauri multer axios cors jsonwebtoken

for utils service:
npm i express dotenv cloudinary
npm i -D typescript @types/node @types/express concurrently
docker run -d \
 --hostname rabbitmq-host \
 --name rabbitmq-container \
 -e RABBITMQ_DEFAULT_USER=admin \
 -e RABBITMQ_DEFAULT_PASS=admin \
 -p 5672:5672 \
 -p 15672:15672 \
 rabbitmq:3-management
