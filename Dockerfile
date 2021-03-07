FROM node:15-alpine AS ts-compiler
RUN apk add --update-cache \
    build-base cmake libtool \
    automake autoconf git \
    subversion
WORKDIR /matchmaker-api
COPY ./package.json ./yarn.lock ./
RUN yarn install
COPY . .
RUN yarn run clean
RUN yarn run build

FROM node:15-alpine as production
WORKDIR /matchmaker-api
RUN apk --no-cache add git 
COPY --from=ts-compiler ./matchmaker-api/dist ./dist
COPY ./package.json ./yarn.lock ./
RUN ls -a
RUN yarn install --production
CMD [ "npm","start" ]

