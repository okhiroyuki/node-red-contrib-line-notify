module.exports = function(RED) {
    'use strcit';

    const axios = require('axios');
    const qs = require('querystring');
    const BASE_URL = 'https://notify-api.line.me';
    const PATH =  '/api/notify';

    function validateString(value){
        return typeof value === 'string'
    }

    function isImageUrl(node){
        return node.contentType === "imageUrl";
    }

    function isSticker(node){
        return node.contentType === "sticker";
    }

    function validateNumber(value){
        return typeof value === 'number';
    }

    function LineNotifyNode(n) {
        RED.nodes.createNode(this, n);
        this.message = n.message;
        this.stickerPackageId = Number(n.stickerPackageId);
        this.stickerId = Number(n.stickerId);
        this.imageUrl = n.imageUrl;
        this.contentType = n.contentType;
        this.silent = n.silent;
        if (RED.nodes.getNode(n.creds)){
            this.accessToken = RED.nodes.getNode(n.creds).credentials.accessToken;
        } else {
            this.accessToken = "";
        }
        let node = this;

        node.on('input', function(msg) {
            if(!node.accessToken){
                sendError(node, "toeken is empty");
                return;
            }
            if(!node.message && validateString(msg.message)){
                node.message = msg.message;
            }

            let datajson = {
                message: node.message
            };
            if(node.silent){
                datajson.notificationDisabled = true;
            }
            if(isImageUrl(node)){
                if(node.imageUrl && validateString(msg.url)){
                    datajson.imageThumbnail = msg.imageUrl;
                    datajson.imageFullsize = msg.imageUrl;
                }else{
                    datajson.imageThumbnail = node.imageUrl;   
                    datajson.imageFullsize = node.imageUrl;   
                }
            }
            if(isSticker(node)){
                if(validateNumber(msg.stickerPackageId) && node.stickerPackageId === -1){
                    datajson.stickerPackageId = msg.stickerPackageId;
                }else{
                    datajson.stickerPackageId = node.stickerPackageId;
                }
                if(validateNumber(msg.stickerId) && node.stickerId === -1){
                    datajson.stickerId = msg.stickerId;
                }else{
                    datajson.stickerId = node.stickerId;
                }
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
                msg.payload = res.data;
                node.send(msg);
                node.status({
                    fill: "blue",
                    shape: "dot",
                    text: "success"
                });
            })
            .catch((error) => {
                sendError(node, error.message);
            });
        });
    }

    function sendError(node, message){
        node.error(message);
        node.status({
            fill: "red",
            shape: "ring",
            text: message
        });
    }

    function linetoken(n){
        RED.nodes.createNode(this, n);
        this.accessToken = n.accessToken;
    }

    RED.nodes.registerType("line-notify", LineNotifyNode, {
        credentials: {
            accessToken: {type:"text"}
        }
    });

    RED.nodes.registerType("linetoken", linetoken,{
        credentials: {
          accessToken: {type:"text"}
        }
    });
}
