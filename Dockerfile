FROM node:15-alpine
WORKDIR /matchmaker-api
COPY . .
RUN apk add subversion
RUN yarn install
CMD ["yarn","run","dev"]
