FROM node:15-alpine
RUN apk --update --no-cache add build-base cmake libtool automake autoconf
RUN apk add subversion
WORKDIR /matchmaker-api
COPY . .
RUN yarn install
ARG NODE_ENV=production
ENV NODE_ENV ${NODE_ENV}
CMD ["yarn","run","dev"]
