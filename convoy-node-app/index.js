const express = require("express");
const cors = require("cors");
const proxy = require("express-http-proxy");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;
const baseUrl = process.env.API_URL;

app.use(express.json());
app.use(cors());
app.use(
    "/",
    proxy(baseUrl, {
        proxyReqBodyDecorator: (bodyContent, srcReq) => {
            return JSON.stringify(srcReq.body);
        },
        proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
            proxyReqOpts.headers["Content-Type"] = "application/json";
            return proxyReqOpts;
        },
    })
);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
