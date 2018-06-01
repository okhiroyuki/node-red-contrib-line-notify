module.exports = function(RED) {
    'use strcit';

    const axios = require('axios');
    const qs = require('querystring');
    const BASE_URL = 'https://notify-api.line.me';
    const PATH =  '/api/notify';
    const contentTypes = ['message',"imageUrl","sticker"];

    function LineNotifyNode(n) {
        RED.nodes.createNode(this, n);
        let node = this;
        node.message = n.message;
        node.accessToken = this.credentials.accessToken;
        node.stickerPackageId = Number(n.stickerPackageId);
        node.stickerId = Number(n.stickerId);
        node.imageUrl = n.imageUrl;
        node.contentType = n.contentType;

        node.on('input', function(msg) {
            if(msg.contentType !== undefined && contentTypes.indexOf(msg.contentType) !== -1){
                node.contentType = msg.contentType;
            }
            if(msg.message !== undefined && typeof msg.message === 'string'){
                node.message = msg.message;
            }
            switch(node.contentType){
                case 'imageUrl':
                    if(msg.url !== undefined && typeof msg.url === 'string'){
                        node.imageUrl = msg.imageUrl;
                    }
                    break;
                case 'sticker':
                    if(msg.stickerPackageId !== undefined && typeof msg.stickerPackageId === 'number'){
                        node.stickerPackageId = msg.spid;
                    }
                    if(msg.stickerId !== undefined && typeof msg.stickerId === 'number'){
                        node.stickerId = msg.stickerId;
                    }
                    break;
            }

            let datajson;
            switch(node.contentType){
                case "message":
                    datajson = {
                        message: node.message
                    };
                    break;
                case "imageUrl":
                    datajson = {
                        message: node.message,
                        imageThumbnail: node.imageUrl,
                        imageFullsize: node.imageUrl
                    };
                    break;
                case "sticker":
                    datajson = {
                        message: node.message,
                        stickerPackageId: node.stickerPackageId,
                        stickerId: node.stickerId
                    };
                    break;
            }

            let lineconfig = {
                baseURL: BASE_URL,
                url: PATH,
                method: 'post',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Bearer ' + node.accessToken
                },
                data: qs.stringify(datajson)
            };

            axios.request(lineconfig)
            .then((res) => {
                node.status({
                    fill: "blue",
                    shape: "dot",
                    text: "success"
                });
            })
            .catch((error) => {
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: error.message
                });
            });
        });
    }

    RED.nodes.registerType("line-notify", LineNotifyNode, {
        credentials: {
            accessToken: {type:"text"}
        }
    });
}
