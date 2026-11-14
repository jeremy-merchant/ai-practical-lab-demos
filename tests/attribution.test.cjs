const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const vm = require("node:vm");

const script = fs.readFileSync("attribution.js", "utf8");
const makeAnchor = original => ({
  original,
  href: original,
  getAttribute(attr) {
    return attr === "href" ? this.href : null;
  }
});
function execute(search = "", referer = "") {
  const anchors = [
    makeAnchor("/check/"),
    makeAnchor("https://www.latpeed.com/products/tej54?utm_source=ai_lab_demo&utm_medium=owned_site&utm_campaign=launch_20261114&utm_content=archive"),
    makeAnchor("https://www.latpeed.com/products/sb5ge?utm_source=ai_lab_demo&utm_medium=owned_site&utm_campaign=launch_20261114&utm_content=adpilot"),
    makeAnchor("/contact/"),
    makeAnchor("#archive"),
    makeAnchor("https://github.com/jeremy-merchant/ai-practical-lab-demos")
  ];
  const location = new URL("https://latpeed-ai-lab-preview.pages.dev/" + search);
  vm.runInNewContext(script, {
    URL, URLSearchParams,
    window: { location },
    document: { referrer: referer, querySelectorAll: () => anchors },
  }, { timeout: 3000 });
  return anchors;
}
test("no UTM or known referrer preserves all links", () => {
  for (const anchor of execute()) assert.equal(anchor.href, anchor.original);
});
test("Cozit UTM travels across homepage to checker and purchase links", () => {
  const links = execute("?utm_source=cozit&utm_medium=directory&utm_campaign=launch_20261115");
  assert.equal(new URL(links[0].href).searchParams.get("utm_source"), "cozit");
  assert.equal(new URL(links[0].href).pathname, "/check/");
  assert.equal(new URL(links[1].href).searchParams.get("utm_source"), "cozit");
  assert.equal(new URL(links[1].href).searchParams.get("utm_content"), "archive");
  assert.equal(new URL(links[2].href).searchParams.get("utm_content"), "adpilot");
  assert.equal(links[3].href, links[3].original);
  assert.equal(links[4].href, links[4].original);
  assert.equal(links[5].href, links[5].original);
});
test("Ignlab referrer works when directory strips UTM", () => {
  const links = execute("", "https://launch.ignlab.net/t/ai-practical-lab");
  assert.equal(new URL(links[1].href).searchParams.get("utm_source"), "ignlab_launch");
});
test("Unknown / malicious query source is never forwarded", () => {
  const links = execute("?utm_source=someone%40example.com&utm_campaign=%3Cscript%3E");
  for (const link of links) assert.equal(link.href, link.original);
});
test("URL parameters cannot inject unsupported checkout host", () => {
  const links = execute("?utm_source=seodatapulse&next=https://malicious.example/path");
  for (const link of links) assert.ok(!link.href.includes("malicious.example"));
  assert.equal(new URL(links[2].href).hostname, "www.latpeed.com");
});
test("Attribution script never transmits or stores user data", () => {
  for (const pattern of ["fetch(", "XMLHttpRequest", "sendBeacon", "localStorage", "sessionStorage", "document.cookie"]) {
    assert.equal(script.includes(pattern), false, pattern);
  }
});
