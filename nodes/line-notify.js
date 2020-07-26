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

    function trimDataJson(json){
        if(!json.imageThumbnail){
            delete json.imageThumbnail
        }
        return json;
    }

    function LineNotifyNode(n) {
        RED.nodes.createNode(this, n);
        this.message = n.message;
        this.sticker = n.sticker;
        this.stickerPackageId = Number(n.stickerPackageId);
        this.stickerId = Number(n.stickerId);
        this.imageUrl = n.imageUrl;
        this.imageThumbnail = n.imageThumbnail;
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
                msg.payload = "token is empty";
                msg.status = -1;
                sendError(node, msg);
                return;
            }
            let dataJson = {
                message: node.message
            };
            if(validateString(msg.payload)){
                if(!dataJson.message){
                    dataJson.message = msg.payload;
                }else{
                    node.warn(RED._("line-notify.warn.noOverride.message"));
                }    
            }
            if(node.silent){
                dataJson.notificationDisabled = true;
            }
            if(isImageUrl(node)){
                if(validateString(msg.imageThumbnail)){
                    if(node.imageThumbnail){
                        dataJson.imageThumbnail = node.imageThumbnail;
                        node.warn(RED._("line-notify.warn.noOverride.imageThumbnail"));
                    }else{
                        dataJson.imageThumbnail = msg.imageThumbnail;
                    }
                }else{
                    dataJson.imageThumbnail = node.imageThumbnail;
                }
                if(validateString(msg.imageUrl)){
                    if(node.imageUrl){
                        dataJson.imageFullsize = node.imageUrl;   
                        node.warn(RED._("line-notify.warn.noOverride.imageUrl"));
                    }else{
                        dataJson.imageFullsize = msg.imageUrl;    
                    }
                }else{
                    dataJson.imageFullsize = node.imageUrl;   
                }
                if(!dataJson.imageFullsize){
                    sendError(node, RED._("line-notify.errors.imageUrl"));
                }
                if(!dataJson.imageThumbnail){
                    dataJson.imageThumbnail = dataJson.imageFullsize;
                }
            }
            if(isSticker(node)){
                if(canOverwriteSticker(node)){
                    if(validateNumber(msg.stickerPackageId)){
                        dataJson.stickerPackageId = msg.stickerPackageId;
                    }else{
                        dataJson.stickerPackageId = node.stickerPackageId;
                        sendError(node, RED._("line-notify.errors.stickerPackageId"));
                        return;
                    }
                    if(validateNumber(msg.stickerId)){
                        dataJson.stickerId = msg.stickerId;
                    }else{
                        dataJson.stickerId = node.stickerId;
                        sendError(node, RED._("line-notify.errors.stickerId"));
                        return;
                    }
                }else{
                    dataJson.stickerPackageId = node.stickerPackageId;
                    dataJson.stickerId = node.stickerId;
                }
            }

            let lineConfig = {
                baseURL: BASE_URL,
                url: PATH,
                method: 'post',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Bearer ' + node.accessToken
                },
                data: qs.stringify(trimDataJson(dataJson))
            };

            axios.request(lineConfig).then((res) => {
                msg.status = res.data.status;
                node.send(msg);
                node.status({fill: "blue", shape: "dot", text: "success"});
            })
            .catch((error) => {
                msg.status = error.response.data.status;
                msg.payload = error.response.data.message;
                sendError(node, msg);
            });
        });
    }

    function sendError(node, msg){
        node.error(msg);
        node.status({ fill: "red", shape: "ring", text: msg.payload});
    }

    function lineToken(n){
        RED.nodes.createNode(this, n);
        this.accessToken = n.accessToken;
    }

    RED.nodes.registerType("line-notify", LineNotifyNode, {
        credentials: {
            accessToken: {type:"text"}
        }
    });

    RED.nodes.registerType("linetoken", lineToken,{
        credentials: {
          accessToken: {type:"text"}
        }
    });
}
