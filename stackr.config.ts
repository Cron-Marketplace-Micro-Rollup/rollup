import { KeyPurpose, SignatureScheme, StackrConfig } from "@stackr/stackr-js";

// this file is generated by the deployment script
import * as deployment from "./deployment.json";

const stackrConfig: StackrConfig = {
  stackrApp: {
    appId: deployment.app_id,
    appInbox: deployment.app_inbox,
  },
  builder: {
    batchSize: 16,
    batchTime: 1000,
  },
  syncer: {
    slotTime: 1000,
    vulcanRPC: "http://vulcan.stf.xyz",
    L1RPC: "http://rpc.stf.xyz",
  },
  operator: {
    accounts: [
      {
        privateKey:
          "4a8b5a8e93e3173f4df84362b5129f07ebe50f43f0e018d844b35d82a9e3b8c9",
        purpose: KeyPurpose.BATCH,
        scheme: SignatureScheme.ECDSA,
      },
    ],
  },
  domain: {
    name: "Cron Market",
    version: "1",
    chainId: 317,
    verifyingContract: deployment.app_inbox,
    salt: "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  },
  datastore: {
    filePath: "./datastore",
  },
};

export { stackrConfig };
