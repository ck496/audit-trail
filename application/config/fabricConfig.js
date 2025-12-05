import dotenv from "dotenv";
dotenv.config();

export const fabricConfig = {
  channelName: process.env.CHANNEL_NAME || "audit-channel",
  chaincodeName: process.env.CHAINCODE_NAME || "audit-trail",
  orgName: process.env.ORG_NAME || "Org1",
  mspId: process.env.MSP_ID || "Org1MSP",
  connectionProfilePath: process.env.CONNECTION_PROFILE_PATH,
  certPath: process.env.CERT_PATH,
  keyPath: process.env.KEY_PATH,
  walletPath: process.env.WALLET_PATH || "./wallet",
  userId: "admin", // Identity needed to use from wallet
};
