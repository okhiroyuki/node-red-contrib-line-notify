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
                done();
            });
            n1.receive({});
        });
    });

    (process.env.GITHUB_ACTIONS ? describe.skip : describe)("should send returned message", () => {
        const tests=[
            {title:"send message" , flow: { id: "n1", type: "line-notify", name: "test", message:"message test", creds: "creds", contentType: "message", wires:[["n2"]]}},
            {title:"send sticker" , flow: { id: "n1", type: "line-notify", name: "test", message:"sticker test", creds: "creds", contentType: "sticker", sticker: "default", stickerPackageId: 1, stickerId: 3, wires:[["n2"]]}},
            {title:"send image" , flow: { id: "n1", type: "line-notify", name: "test", message:"image test", creds: "creds", contentType: "imageUrl", imageUrl: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png", wires:[["n2"]]}}            
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
                        should.equal(msg.payload.status,200);
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

    (process.env.GITHUB_ACTIONS ? describe.skip : describe)("should send returned message using msg.message", () => {
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
                    should.equal(msg.payload.status,200);
                });
                n1.on("call:warn", (msg) => {
                    should.equal(msg.lastArg,"line-notify.warn.nooverride.message");
                    done();
                });
                n1.receive({message: "can overwrite"});
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
                    should.equal(msg.payload.status,200);
                    done();
                });
                n1.receive({message: "can overwrite"});
            });  
        });
    });

    (process.env.GITHUB_ACTIONS ? describe.skip : describe)("should send returned message using msg.imageUrl", () => {
        it("can't overwrite", (done) => {
            const flow = [
                { id: "n1", type: "line-notify", name: "test", message:"can't overwrite image", creds: "creds", contentType: "imageUrl", imageUrl: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png", wires:[["n2"]]},
                { id: "creds", type: "linetoken"},
                { id: "n2", type: "helper" }
            ];
            helper.load(node, flow, {creds:{accessToken: line_token}},() => {
                const n2 = helper.getNode("n2");
                const n1 = helper.getNode("n1");
                n2.on("input", (msg) => {
                    should.equal(msg.payload.status,200);
                });
                n1.on("call:warn", (msg) => {
                    should.equal(msg.lastArg,"line-notify.warn.nooverride.imageUrl");
                    done();
                });
                n1.receive({imageUrl: "dummy"});
            });    
        });
        it("can overwrite", (done) => {
            const flow = [
                { id: "n1", type: "line-notify", name: "test", message:"can override image", creds: "creds", contentType: "imageUrl", imageUrl: "", wires:[["n2"]]},
                { id: "creds", type: "linetoken"},
                { id: "n2", type: "helper" }
            ];
            helper.load(node, flow, {creds:{accessToken: line_token}},() => {
                const n2 = helper.getNode("n2");
                const n1 = helper.getNode("n1");
                n2.on("input", (msg) => {
                    should.equal(msg.payload.status,200);
                    done();
                });
                n1.receive({imageUrl: "https://dummyimage.com/640x480"});
            });  
        });
    });

    (process.env.GITHUB_ACTIONS ? describe.skip : describe)("should send returned message using msg.stickerId", () => {
        it("error", (done) => {
            const flow = [
                { id: "n1", type: "line-notify", name: "test", message:"can't overwrite stickerId", creds: "creds", contentType: "sticker", sticker: "default", sticker:"msg", stickerPackageId: 1, stickerId: 10, wires:[["n2"]]},
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
                    should.equal(msg.payload.status,200);
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
                    should.equal(msg.payload.status,200);
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