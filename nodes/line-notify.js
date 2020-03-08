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
                sendError(node, "token is empty");
                return;
            }
            let datajson = {
                message: node.message
            };
            if(validateString(msg.payload)){
                if(!datajson.message){
                    datajson.message = msg.payload;
                }else{
                    node.warn(RED._("line-notify.warn.nooverride.message"));
                }    
            }
            if(node.silent){
                datajson.notificationDisabled = true;
            }
            if(isImageUrl(node)){
                if(validateString(msg.imageThumbnail)){
                    if(node.imageThumbnail){
                        datajson.imageThumbnail = node.imageThumbnail;
                        node.warn(RED._("line-notify.warn.nooverride.imageThumbnail"));
                    }else{
                        datajson.imageThumbnail = msg.imageThumbnail;
                    }
                }else{
                    datajson.imageThumbnail = node.imageThumbnail;
                }
                if(validateString(msg.imageUrl)){
                    if(node.imageUrl){
                        datajson.imageFullsize = node.imageUrl;   
                        node.warn(RED._("line-notify.warn.nooverride.imageUrl"));
                    }else{
                        datajson.imageFullsize = msg.imageUrl;    
                    }
                }else{
                    datajson.imageFullsize = node.imageUrl;   
                }
                if(!datajson.imageFullsize){
                    sendError(node, RED._("line-notify.errors.imageUrl"));
                }
                if(!datajson.imageThumbnail){
                    datajson.imageThumbnail = datajson.imageFullsize;
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
                data: qs.stringify(trimDataJson(datajson))
            };

            axios.request(lineconfig).then((res) => {
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
