FROM node:10

WORKDIR /app
COPY package*.json ./
RUN npm install --only=prod

COPY . .

EXPOSE 5435
CMD ["npm", "start"]
