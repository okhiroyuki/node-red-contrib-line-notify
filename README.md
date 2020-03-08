# node-red-contrib-line-notify

An easy-to-use NodeRED node for sending Line Notify.

## Note

**The handling method of the message using the msg variable differs depending on the version.**

### 3.0.0 or higher

Handle messages with `msg.payload`.

### 2.1.0 or lower

Handle messages with `msg.message`.

## Install

Run the following command in your Node-RED user directory - typically ~/.node-red

```shell
npm install node-red-contrib-line-notify
```

## Usages

1. Obtain an access token with [LINE Notify](https://notify-bot.line.me/en/) and set it in the linetoken node.
2. Enter necessary items on the setting screen and execute.
3. LINE receives notification.

For further details of see [LINE Notify API Document](https://notify-bot.line.me/doc/en/).
