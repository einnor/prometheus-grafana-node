FROM node:12

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
RUN npm install

EXPOSE 4000

CMD [ "npm", "start" ]