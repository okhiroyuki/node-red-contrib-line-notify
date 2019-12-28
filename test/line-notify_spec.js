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

    (process.env.GITHUB_ACTIONS ? describe.skip : describe)("should make payload", () => {
        it("send message", (done) => {
            const flow = [
                { id: "n1", type: "line-notify", name: "test", message:"ci test", creds: "creds", contentType: "message", wires:[["n2"]]},
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

        it("send sticker", (done) => {
            const flow = [
                { id: "n1", type: "line-notify", name: "test", message:"ci test", creds: "creds", contentType: "sticker", stickerPackageId: 1, stickerId: 3, wires:[["n2"]]},
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

        it("send image", (done) => {
            const flow = [
                { id: "n1", type: "line-notify", name: "test", message:"ci test", creds: "creds", contentType: "imageUrl", imageUrl: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png", wires:[["n2"]]},
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
});