exports.config = {
    "redisQueuesConf": {
        "sentinels": [
          { "host": "xxxxxx.com", "port": 1234 },
          { "host": "xxx2.com", "port": 1234 },
          { "host": "xxx3.com", "port": 1234 }
        ],
        "name": "prod-mta-queue"
      }
}
