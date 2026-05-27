const Module = require("node:module");
const path = require("node:path");

const originalResolveFilename = Module._resolveFilename;
const buildSrc = path.resolve(__dirname, "..", ".test-build");

Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    return originalResolveFilename.call(
      this,
      path.join(buildSrc, request.slice(2)),
      parent,
      isMain,
      options
    );
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};
