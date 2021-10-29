FROM node:16

ENV PORT=3000

WORKDIR /usr/app

COPY package*.json ./

RUN yarn

COPY . .

EXPOSE 1516

CMD [ "yarn", "nonstop" ]
