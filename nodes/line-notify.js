'use strcit';

module.exports = function(RED) {
    const line = require('axios');
    const qs = require('querystring');
    const BASE_URL = 'https://notify-api.line.me';
    const PATH =  '/api/notify';

    function LineNotifyNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;

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
                    'Authorization': 'Bearer ' + node.credentials.token;
                },
                data: qs.stringify({
                    message: node.message,
                })
            };

            axios.request(config)
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
