const should = require("should");
const helper = require("node-red-node-test-helper");
helper.init(require.resolve("node-red"));

const node = require("../nodes/line-notify");
let line_token;

describe("Line Notify Node", () => {

    before(function(done) {
        line_token = process.env.LINE_TOKEN;
        helper.startServer(done);
    });

    after((done) => {
        helper.stopServer(done);
    });

    afterEach(() => {
        helper.unload();
    });

    it("should be loaded", (done) => {
        const flow = [
            { id: "n1", type: "line-notify", creds: "creds", name: "test"},
            { id: "creds", type: "linetoken"}
        ];
        helper.load(node, flow, {creds:{accessToken: line_token}}, () => {
            const n1 = helper.getNode("n1");
            n1.should.have.property("name", "test");
            done();
        });
    });

    it("should make payload without token", (done) => {
        const flow = [
            { id: "n1", type: "line-notify", name: "test", message:"ci test", contentType: "message"},
            { id: "creds", type: "linetoken"}
        ];
        helper.load(node, flow, {creds:{accessToken: "dummy"}}, () => {
            const n1 = helper.getNode("n1");
            n1.on("call:error", (err) => {
                should.equal(err.lastArg.payload,"token is empty");
                should.equal(err.lastArg.status,-1);
                done();
            });
            n1.receive({});
        });
    });

    it("error token", (done) => {
        const flow = [
            { id: "n1", type: "line-notify", name: "test", message:"message test", creds: "creds", contentType: "message", wires:[["n2"]]},
            { id: "creds", type: "linetoken"},
            { id: "n2", type: "helper" }
        ];
        helper.load(node, flow, {creds:{accessToken: "hoge"}},() => {
            const n2 = helper.getNode("n2");
            const n1 = helper.getNode("n1");
            n1.on("call:error", (err) => {
                should.equal(err.lastArg.status,401);
                should.equal(err.lastArg.payload, "Invalid access token");        
                done();
            });
            n1.receive({payload: "test"});
        });
    });

    (process.env.GITHUB_ACTIONS ? describe.skip : describe)("should send returned message", () => {
        const tests=[
            {title:"send message" , flow: { id: "n1", type: "line-notify", name: "test", message:"message test", creds: "creds", contentType: "message", wires:[["n2"]]}},
            {title:"send sticker" , flow: { id: "n1", type: "line-notify", name: "test", message:"sticker test", creds: "creds", contentType: "sticker", sticker: "default", stickerPackageId: 1, stickerId: 3, wires:[["n2"]]}},
            {title:"send image" , flow: { id: "n1", type: "line-notify", name: "test", message:"image test", creds: "creds", contentType: "imageUrl", imageUrl: "https://dummyimage.com/2028x2048", imageThumbnail: "https://dummyimage.com/240x240", wires:[["n2"]]}}            
        ]
        tests.forEach((test) => {
            it(test.title, (done) => {
                const flow = [
                    test.flow,
                    { id: "creds", type: "linetoken"},
                    { id: "n2", type: "helper" }
                ];
                helper.load(node, flow, {creds:{accessToken: line_token}},() => {
                    const n2 = helper.getNode("n2");
                    const n1 = helper.getNode("n1");
                    n2.on("input", (msg) => {
                        should.equal(msg.status,200);
                        should.equal(msg.payload, "test");
                        done();
                    });
                    n1.on("call:error", (err) => {
                        done(err);
                    });
                    n1.receive({payload: "test"});
                });
            });
        })
    });

    (process.env.GITHUB_ACTIONS ? describe.skip : describe)("should send returned message using msg.payload", () => {
        it("can't overwrite", (done) => {
            const flow = [
                { id: "n1", type: "line-notify", name: "test", message:"can't overwrite", creds: "creds", silent: true, contentType: "message", wires:[["n2"]]},
                { id: "creds", type: "linetoken"},
                { id: "n2", type: "helper" }
            ];
            helper.load(node, flow, {creds:{accessToken: line_token}},() => {
                const n2 = helper.getNode("n2");
                const n1 = helper.getNode("n1");
                n2.on("input", (msg) => {
                    should.equal(msg.status,200);
                    should.equal(msg.payload, "can overwrite");
                });
                n1.on("call:warn", (msg) => {
                    should.equal(msg.lastArg,"line-notify.warn.noOverride.message");
                    done();
                });
                n1.receive({payload: "can overwrite"});
            });    
        });
        it("can overwrite", (done) => {
            const flow = [
                { id: "n1", type: "line-notify", name: "test", message:"", creds: "creds", silent: true, contentType: "message", wires:[["n2"]]},
                { id: "creds", type: "linetoken"},
                { id: "n2", type: "helper" }
            ];
            helper.load(node, flow, {creds:{accessToken: line_token}},() => {
                const n2 = helper.getNode("n2");
                const n1 = helper.getNode("n1");
                n2.on("input", (msg) => {
                    should.equal(msg.status,200);
                    done();
                });
                n1.receive({payload: "can overwrite"});
            });  
        });
    });

    (process.env.GITHUB_ACTIONS ? describe.skip : describe)("should send returned message using msg.imageUrl", () => {
        it("can't overwrite", (done) => {
            const flow = [
                { id: "n1", type: "line-notify", name: "test", message:"can't overwrite image", creds: "creds", contentType: "imageUrl", imageUrl:"https://dummyimage.com/2028x2048", imageThumbnail: "", wires:[["n2"]]},
                { id: "creds", type: "linetoken"},
                { id: "n2", type: "helper" }
            ];
            helper.load(node, flow, {creds:{accessToken: line_token}},() => {
                const n2 = helper.getNode("n2");
                const n1 = helper.getNode("n1");
                n2.on("input", (msg) => {
                    should.equal(msg.status,200);
                });
                n1.on("call:warn", (msg) => {
                    should.equal(msg.lastArg,"line-notify.warn.noOverride.imageUrl");
                    done();
                });
                n1.receive({imageUrl: "dummy"});
            });    
        });
        it("no image", (done) => {
            const flow = [
                { id: "n1", type: "line-notify", name: "test", message:"can override image", creds: "creds", contentType: "imageUrl", imageUrl:"", imageThumbnail: "", wires:[["n2"]]},
                { id: "creds", type: "linetoken"},
                { id: "n2", type: "helper" }
            ];
            helper.load(node, flow, {creds:{accessToken: line_token}},() => {
                const n1 = helper.getNode("n1");
                n1.on("call:error", (msg) => {
                    should.equal(msg.lastArg,"line-notify.errors.imageUrl");
                    done();
                });
                n1.receive({});
            });  
        });
        it("can overwrite", (done) => {
            const flow = [
                { id: "n1", type: "line-notify", name: "test", message:"can override image", creds: "creds", contentType: "imageUrl", imageUrl:"", imageThumbnail: "", wires:[["n2"]]},
                { id: "creds", type: "linetoken"},
                { id: "n2", type: "helper" }
            ];
            helper.load(node, flow, {creds:{accessToken: line_token}},() => {
                const n2 = helper.getNode("n2");
                const n1 = helper.getNode("n1");
                n2.on("input", (msg) => {
                    should.equal(msg.status,200);
                    done();
                });
                n1.receive({imageUrl: "https://dummyimage.com/640x640"});
            });  
        });
    });

    (process.env.GITHUB_ACTIONS ? describe.skip : describe)("should send returned message using msg.thumbnailUrl", () => {
        it("can't overwrite", (done) => {
            const flow = [
                { id: "n1", type: "line-notify", name: "test", message:"can't overwrite image", creds: "creds", contentType: "imageUrl", imageUrl: "https://dummyimage.com/2048x2048", imageThumbnail: "https://dummyimage.com/240x240", wires:[["n2"]]},
                { id: "creds", type: "linetoken"},
                { id: "n2", type: "helper" }
            ];
            helper.load(node, flow, {creds:{accessToken: line_token}},() => {
                const n2 = helper.getNode("n2");
                const n1 = helper.getNode("n1");
                n2.on("input", (msg) => {
                    should.equal(msg.status,200);
                });
                n1.on("call:warn", (msg) => {
                    should.equal(msg.lastArg,"line-notify.warn.noOverride.imageThumbnail");
                    done();
                });
                n1.receive({imageThumbnail: "dummy"});
            });    
        });
        it("can overwrite", (done) => {
            const flow = [
                { id: "n1", type: "line-notify", name: "test", message:"can override image", creds: "creds", contentType: "imageUrl", imageUrl: "https://dummyimage.com/2048x2048", imageThumbnail: "", wires:[["n2"]]},
                { id: "creds", type: "linetoken"},
                { id: "n2", type: "helper" }
            ];
            helper.load(node, flow, {creds:{accessToken: line_token}},() => {
                const n2 = helper.getNode("n2");
                const n1 = helper.getNode("n1");
                n2.on("input", (msg) => {
                    should.equal(msg.status,200);
                    done();
                });
                n1.receive({imageThumbnail: "https://dummyimage.com/64x64"});
            });  
        });
    });

    (process.env.GITHUB_ACTIONS ? describe.skip : describe)("should send returned message using msg.stickerId", () => {
        it("error", (done) => {
            const flow = [
                { id: "n1", type: "line-notify", name: "test", message:"can't overwrite stickerId", creds: "creds", contentType: "sticker", sticker: "msg", stickerPackageId: 1, stickerId: 10, wires:[["n2"]]},
                { id: "creds", type: "linetoken"},
                { id: "n2", type: "helper" }
            ];
            helper.load(node, flow, {creds:{accessToken: line_token}},() => {
                const n1 = helper.getNode("n1");
                n1.on("call:error", (msg) => {
                    should.equal(msg.lastArg,"line-notify.errors.stickerId");
                    done();
                });
                n1.receive({
                    stickerPackageId: 1
                });
            });    
        });
        it("can overwrite", (done) => {
            const flow = [
                { id: "n1", type: "line-notify", name: "test", message:"can overwrite stickerId", creds: "creds", contentType: "sticker", sticker:"msg", stickerPackageId: 1, stickerId: 1, wires:[["n2"]]},
                { id: "creds", type: "linetoken"},
                { id: "n2", type: "helper" }
            ];
            helper.load(node, flow, {creds:{accessToken: line_token}},() => {
                const n2 = helper.getNode("n2");
                const n1 = helper.getNode("n1");
                n2.on("input", (msg) => {
                    should.equal(msg.status,200);
                    done();
                });
                n1.receive({
                    stickerPackageId: 1,
                    stickerId: 11
                });
            });    
        });
    });

    (process.env.GITHUB_ACTIONS ? describe.skip : describe)("should send returned message using msg.stickerPackageId", () => {
        it("error", (done) => {
            const flow = [
                { id: "n1", type: "line-notify", name: "test", message:"can't overwrite stickerPackageId", creds: "creds", contentType: "sticker", sticker: "msg", stickerPackageId: 2, stickerId: 18, wires:[["n2"]]},
                { id: "creds", type: "linetoken"},
                { id: "n2", type: "helper" }
            ];
            helper.load(node, flow, {creds:{accessToken: line_token}},() => {
                const n1 = helper.getNode("n1");
                n1.on("call:error", (msg) => {
                    should.equal(msg.lastArg,"line-notify.errors.stickerPackageId");
                    done();
                });
                n1.receive({
                    stickerId: 180
                });
            });    
        });
        it("can overwrite", (done) => {
            const flow = [
                { id: "n1", type: "line-notify", name: "test", message:"can overwrite stickerPackageId", creds: "creds", contentType: "sticker", sticker: "default", stickerPackageId: 1, stickerId: 1, wires:[["n2"]]},
                { id: "creds", type: "linetoken"},
                { id: "n2", type: "helper" }
            ];
            helper.load(node, flow, {creds:{accessToken: line_token}},() => {
                const n2 = helper.getNode("n2");
                const n1 = helper.getNode("n1");
                n2.on("input", (msg) => {
                    should.equal(msg.status,200);
                    done();
                });
                n1.receive({
                    stickerId: 180,
                    stickerPackageId: 3
                });
            });    
        });
    });
});
