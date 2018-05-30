module.exports = function(RED) {
    'use strcit';

    const axios = require('axios');
    const qs = require('querystring');
    const BASE_URL = 'https://notify-api.line.me';
    const PATH =  '/api/notify';

    function LineNotifyNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;
        node.message = n.message;
        node.accessToken = n.accessToken;
        node.stickerPackageId = n.stickerPackageId;
        node.stickerId = n.stickerId;

        node.on('input', function(msg) {
            if(msg.message !== undefined && typeof msg.message === 'string'){
                node.message = msg.message;
            }

            let lineconfig = {
                baseURL: BASE_URL,
                url: PATH,
                method: 'post',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Bearer ' + node.accessToken
                },
                data: qs.stringify({
                    message: node.message,
                    stickerPackageId: node.stickerPackageId,
                    stickerId: node.stickerId
                })
            };

            axios.request(lineconfig)
            .then((res) => {
                console.log(res);
                node.status({
                    fill: "blue",
                    shape: "dot",
                    text: "success"
                });
            })
            .catch((error) => {
                console.log(error);
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: error.message
                });
            });
        });
    }
    RED.nodes.registerType("line-notify",LineNotifyNode);
}
