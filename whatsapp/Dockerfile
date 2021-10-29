FROM node:16

RUN rm -rf /usr/app

WORKDIR /usr/app

COPY package*.json ./

RUN yarn

COPY . .

CMD [ "yarn", "build" ]
