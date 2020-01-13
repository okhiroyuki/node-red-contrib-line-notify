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

    function canOverwriteSticker(node){
        return node.sticker === "msg";
    }

    function LineNotifyNode(n) {
        RED.nodes.createNode(this, n);
        this.message = n.message;
        this.sticker = n.sticker;
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
            if(validateString(msg.message)){
                if(!node.message){
                    node.message = msg.message;
                }else{
                    node.warn(RED._("line-notify.warn.nooverride.message"));
                }    
            }

            let datajson = {
                message: node.message
            };
            if(node.silent){
                datajson.notificationDisabled = true;
            }
            if(isImageUrl(node)){
                if(validateString(msg.imageUrl)){
                    if(node.imageUrl){
                        datajson.imageThumbnail = node.imageUrl;   
                        datajson.imageFullsize = node.imageUrl;   
                        node.warn(RED._("line-notify.warn.nooverride.imageUrl"));
                    }else{
                        datajson.imageThumbnail = msg.imageUrl;
                        datajson.imageFullsize = msg.imageUrl;    
                    }
                }else{
                    datajson.imageThumbnail = node.imageUrl;   
                    datajson.imageFullsize = node.imageUrl;   
                }
            }
            if(isSticker(node)){
                if(canOverwriteSticker(node)){
                    if(validateNumber(msg.stickerPackageId)){
                        datajson.stickerPackageId = msg.stickerPackageId;
                    }else{
                        datajson.stickerPackageId = node.stickerPackageId;
                        sendError(node, RED._("line-notify.errors.stickerPackageId"));
                        return;
                    }
                    if(validateNumber(msg.stickerId)){
                        datajson.stickerId = msg.stickerId;
                    }else{
                        datajson.stickerId = node.stickerId;
                        sendError(node, RED._("line-notify.errors.stickerId"));
                        return;
                    }
                }else{
                    datajson.stickerPackageId = node.stickerPackageId;
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

            axios.request(lineconfig).then((res) => {
                msg.payload = res.data;
                node.send(msg);
                node.status({fill: "blue", shape: "dot", text: "success"});
            })
            .catch((error) => {
                sendError(node, error.message);
            });
        });
    }

    function sendError(node, message){
        node.error(message);
        node.status({ fill: "red", shape: "ring", text: message});
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
