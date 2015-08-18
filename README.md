# crawl-reporter

Indefinitely report latest crawl metrics from db to graphite

```
Usage: crawl-reporter [options] [command]

Commands:

  live <max> <timeout> <queueUrl> <dbUrl> <graphiteUrl>

    Indefinitely report crawl metrics from db to graphite using sqs queue
    to determine which crawls need to be processed/reported.
    
    - max     : the max amount of async reports to have running at once
    - timeout : how long to wait between checking for messages

```
