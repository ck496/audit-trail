// MOCKED Fabric Contract for development WITHOUT Hyperledger Fabric

export async function getContract() {
  console.log("⚠ Using MOCK Fabric Contract – No real blockchain connection");

  return {
    submitTransaction: async (fn, ...args) => {
      console.log(`➡ MOCK submitTransaction(${fn}) called with:`, args);

      return JSON.stringify({
        status: "success",
        function: fn,
        args: args,
        message: "Mock transaction executed"
      });
    },

    evaluateTransaction: async (fn, ...args) => {
      console.log(`➡ MOCK evaluateTransaction(${fn}) called with:`, args);

      // Return a fake dataset depending on the function
      if (fn === "QueryAllAudits") {
        return JSON.stringify([
          { userId: "u1", action: "LOGIN", timestamp: Date.now() },
          { userId: "u2", action: "READ", timestamp: Date.now() }
        ]);
      }

      if (fn === "QueryAuditByUser") {
        return JSON.stringify([
          { userId: args[0], action: "LOGIN", timestamp: Date.now() }
        ]);
      }

      if (fn === "GetUser") {
        return JSON.stringify({
          userId: args[0],
          name: "Mock User",
          role: "admin"
        });
      }

      return JSON.stringify({
        status: "success",
        function: fn,
        args: args,
        mock: true
      });
    }
  };
}
