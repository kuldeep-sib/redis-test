# redis-test

# SETUP

run `npm install`

 add your redis conn string in `config.js`
## RUN

`node index.js`

you can configure the number of items to be pushed and popped using COUNT
`COUNT=200000 node index.js`

To pass the redis password use env variable
eg:
`REDIS_PASSWORD=my-password node index.js`

you can enable ioredis DEBUG MODE using env variable
`DEBUG=ioredis:* `