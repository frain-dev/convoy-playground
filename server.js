const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
app.use(cors());
app.use(express.json());
app.use(
    "/",
    createProxyMiddleware({
        target: "http://localhost:5005",
        changeOrigin: true,
        onProxyReq(proxyReq, req, res) {
            if (req.method === "POST" && req.body) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader("Content-Type", "application/json");
                proxyReq.setHeader(
                    "Content-Length",
                    Buffer.byteLength(bodyData)
                );
                proxyReq.write(bodyData);
            }
        },
    })
);

app.listen(3000, () => {
    console.log("Proxy server is running on port 3000");
});
