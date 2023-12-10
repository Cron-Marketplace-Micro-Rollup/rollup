import { ethers } from "ethers";
import { stackrConfig } from "../stackr.config";
import { ActionSchema } from "@stackr/stackr-js";
import actionSchemaType from "../src/action-schema-type";

const actionInput = new ActionSchema("cron-actions", actionSchemaType);

const getData = async () => {
  const wallet = new ethers.Wallet(
    "5af06e43a75c9b82bb469f050a882f33aa9d628453cd2d2f31d0ca822e38cc6f"
  );

  const burnData = {
    type: "burn",
    sender: wallet.address,
    jobActionsParams: {
      jobId: 0,
      reward: "10000",
      chain: "base",
      contract: "0xcontract",
      function: "function",
      triggerStart: "timestamp",
      triggerEnd: "timestamp",
      txHash: "0x...",
    },
    creditActionsParams: {
      from: wallet.address,
      to: wallet.address,
      amount: 100,
    },
  };

  console.log(burnData);

  const sign = await wallet.signTypedData(
    stackrConfig.domain,
    actionInput.EIP712TypedData.types,
    burnData
  );
  console.log(actionInput.EIP712TypedData.types);

  const payload = JSON.stringify({
    msgSender: wallet.address,
    signature: sign,
    payload: burnData,
  });

  console.log(payload);

  return payload;
};

const run = async () => {
  const payload = await getData();

  const res = await fetch("http://localhost:3000/burn", {
    method: "POST",
    body: payload,
    headers: {
      "Content-Type": "application/json",
    },
  });

  console.log(res);
};

await run();
