/**
 * jsdom, plus the Node globals it leaves out: React Router's data router builds
 * `Request` objects on navigation and needs TextEncoder.
 *
 * Node's Request only accepts Node AbortSignals, while the app (and jsdom's own
 * addEventListener) use jsdom's. So the Request here ignores foreign signals —
 * aborting navigation requests doesn't matter in tests.
 */
const { TestEnvironment } = require("jest-environment-jsdom")

const NodeRequest = Request
class TestRequest extends NodeRequest {
  constructor(input, init) {
    if (init && init.signal && !(init.signal instanceof AbortSignal)) {
      const { signal: _ignored, ...rest } = init
      super(input, rest)
    } else {
      super(input, init)
    }
  }
}

module.exports = class JsdomWithNodeGlobals extends TestEnvironment {
  constructor(config, context) {
    super(config, context)
    Object.assign(this.global, {
      Request: TestRequest,
      Response,
      Headers,
      ReadableStream,
      TextEncoder,
      TextDecoder,
      structuredClone,
    })
  }
}
