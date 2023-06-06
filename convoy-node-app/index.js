const express = require("express");
const cors = require("cors");
const proxy = require("express-http-proxy");

const app = express();
const port = 3000;
app.use(express.json());
app.use(cors());
app.use(
  "/",
  proxy("http://localhost:5005", {
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
