const schemaType = {
  type: "String",
  sender: "String",
  jobActionsParams: {
    jobId: "Uint",
    reward: "String",
    chain: "String",
    contract: "String",
    function: "String",
    triggerStart: "String",
    triggerEnd: "String",
    txHash: "String",
  },
  creditActionsParams: {
    from: "String",
    to: "String",
    amount: "String",
  },
};

export default schemaType;
