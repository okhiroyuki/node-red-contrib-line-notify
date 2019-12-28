const should = require("should");
const helper = require("node-red-node-test-helper");
helper.init(require.resolve("node-red"));

const node = require("../nodes/line-notify");
let line_token;

describe("Ngrok Node", () => {

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
        const flow = [{ id: "n1", type: "line-notify", name: "test" }];
        helper.load(node, flow, () => {
            const n1 = helper.getNode("n1");
            n1.should.have.property("name", "test");
            done();
        });
    });

    (process.env.GITHUB_ACTIONS ? describe.skip : describe)("should make payload", () => {
        it("send message", (done) => {
            let isDone = false;
            const flow = [
                { id: "n1", type: "line-notify", name: "test", message:"ci test", contentType: "message"},
                ];
                helper.load(node, flow, {n1:{accessToken:line_token}},() => {
                    const n1 = helper.getNode("n1");
                    n1.on("call:error", (err) => {
                        if(!isDone){
                            isDone = true;
                            done(err);
                    }
                });
                n1.receive({});
                setTimeout(()=>{
                    if(!isDone){
                        isDone = true;
                        done();
                    }
                },1000)
            });
        });

        it("send sticker", (done) => {
            let isDone = false;
            const flow = [
                    { id: "n1", type: "line-notify", name: "test", message:"ci test", contentType: "sticker", stickerPackageId: 1, stickerId: 3},
                ];
                helper.load(node, flow, {n1:{accessToken:line_token}},() => {
                    const n1 = helper.getNode("n1");
                    n1.on("call:error", (err) => {
                        if(!isDone){
                            isDone = true;
                            done(err);
                    }
                });
                n1.receive({});
                setTimeout(()=>{
                    if(!isDone){
                        isDone = true;
                        done();
                    }
                },1000)
            });
        });

        it("send image", (done) => {
            let isDone = false;
            const flow = [
                    { id: "n1", type: "line-notify", name: "test", message:"ci test", contentType: "imageUrl", imageUrl: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png"},
                ];
                helper.load(node, flow, {n1:{accessToken:line_token}},() => {
                    const n1 = helper.getNode("n1");
                    n1.on("call:error", (err) => {
                        if(!isDone){
                            isDone = true;
                            done(err);
                    }
                });
                n1.receive({});
                setTimeout(()=>{
                    if(!isDone){
                        isDone = true;
                        done();
                    }
                },1000)
            });
        });
    });

    it("should make payload without token", (done) => {
        const flow = [
            { id: "n1", type: "line-notify", name: "test", message:"ci test", contentType: "message"},
        ];
        helper.load(node, flow, {n1:{accessToken:"dummy"}},() => {
            const n1 = helper.getNode("n1");
            n1.on("call:error", (err) => {
                done();
            });
            n1.receive({});
        });
    });
});