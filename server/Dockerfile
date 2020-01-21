FROM node:alpine

WORKDIR '/app'
COPY ./package.json ./
RUN npm install
COPY ./ ./
# Using npm run dev instead of nom run start because we want to ensure that if we make any change in the source code our server starts up again.
# To achieve that we are using the functionality of nodemon. Here, our dev script runs nodemon
CMD ["npm", "run", "start"]
