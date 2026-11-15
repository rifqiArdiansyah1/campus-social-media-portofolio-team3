const https = require("https");

function callMcp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method: "tools/call", params: { name: method, arguments: params } });
    const req = https.request("https://stitch.googleapis.com/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.STITCH_API_KEY || "",
        "Content-Length": Buffer.byteLength(data)
      }
    }, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ raw: body });
        }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log("Listing projects...");
  const projRes = await callMcp("list_projects", {});
  console.log("Projects response:", JSON.stringify(projRes, null, 2));

  console.log("\nChecking project 10744711964413240245...");
  const screensRes = await callMcp("list_screens", { projectId: "10744711964413240245" });
  console.log("Screens in 10744711964413240245:", JSON.stringify(screensRes, null, 2));
}

run();
