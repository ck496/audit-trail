import { Gateway, Wallets } from "fabric-network";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fabricConfig } from "../config/fabricConfig.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let gateway = null;
let contract = null;

/**
 * AUTHENTICATION: buildWallet() builds a wallet and enrolls Admin Identity
 * - runs ones when server starts and creates a wallet with admin creds
 * - BUILD WALLET allows you to connect to fabric with cryptographic identity
 *      - cryptographic identity:  X.509 certificates + private keys to sign transactions.)
 */
async function buildWallet() {
  try {
    const walletPath = path.resolve(__dirname, "..", fabricConfig.walletPath);
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check if admin identity already exists in wallet
    const identity = await wallet.get(fabricConfig.userId);
    if (identity) {
      console.log(
        `[FabricConnect]: Identity "${fabricConfig.userId}" already exists in wallet`
      );
      return wallet;
    }

    console.log(`[FabricConnect]: Enrolling admin identity to wallet...`);

    // Read admin certificate from Fabric network
    const certPath = path.resolve(__dirname, "..", fabricConfig.certPath);
    const certificate = fs.readFileSync(certPath).toString();

    // Read admin private key (first file in keystore directory)
    const keyPath = path.resolve(__dirname, "..", fabricConfig.keyPath);
    const keyFiles = fs.readdirSync(keyPath);

    if (keyFiles.length === 0) {
      throw new Error(
        `[FabricConnect] ERROR :  No private key found in keystore directory: ${keyPath}`
      );
    }

    const privateKey = fs
      .readFileSync(path.join(keyPath, keyFiles[0]))
      .toString();

    // Create X.509 identity for admin
    const identityData = {
      credentials: {
        certificate,
        privateKey,
      },
      mspId: fabricConfig.mspId,
      type: "X.509",
    };

    // Store identity in wallet
    await wallet.put(fabricConfig.userId, identityData);
    console.log(
      `[FabricConnect] SUCCESS: Admin identity enrolled and stored in wallet`
    );

    return wallet;
  } catch (error) {
    console.error(
      `[FabricConnect] ERROR : Failed to build wallet: ${error.message}`
    );
    throw new Error(
      `[FabricConnect]: Wallet initialization failed: ${error.message}`
    );
  }
}

/**
 * connectGateway(): Connectss to Fabric Gateway
 * Establishes connection to network and gets the contract instance
 */
export async function connectGateway() {
  // If already connected, return existng contract
  if (contract) {
    return contract;
  }

  try {
    // Build wallet with admin identity
    const wallet = await buildWallet();

    //Load connection profile from network/test-network
    const ccpPath = path.resolve(
      __dirname,
      "..",
      fabricConfig.connectionProfilePath
    );
    const ccpJSON = fs.readFileSync(ccpPath, "utf8");
    const ccp = JSON.parse(ccpJSON);

    //Create a Fabric Gateway instance which works as a Entry point to the fabric network
    gateway = new Gateway();

    const connectionOptions = {
      wallet,
      identity: fabricConfig.userId,
      discovery: { enabled: true, asLocalhost: true },
    };

    //Connect to gateway using connection profile : 'admin'
    await gateway.connect(ccp, connectionOptions);
    console.log(`[FabricConnect]: Connected to Fabric Gateway`);

    //getNetwork gets a specific channel from the fabric network
    const network = await gateway.getNetwork(fabricConfig.channelName);
    console.log(
      `[FabricConnect]: Connected to channel: ${fabricConfig.channelName}`
    );

    // getContract returns deployed chaincode as an object for us to invoke/query functions
    contract = network.getContract(fabricConfig.chaincodeName);
    console.log(`[FabricConnect]: Got contract: ${fabricConfig.chaincodeName}`);

    return contract;
  } catch (error) {
    console.error(
      `[FabricConnect]: ERROR: Failed to connect to Fabric network: ${error}`
    );
    throw error;
  }
}

/**
 * Get contract instance: CREATES CONNECTION to fabric network if it doesnt exist
 * - Controllers call this to get the chaincode contract
 */
export async function getContract() {
  if (!contract) {
    return await connectGateway();
  }
  return contract;
}

/**
 * Disconnect from gateway: call on server shutdown
 */
export async function disconnect() {
  if (gateway) {
    await gateway.disconnect();
    gateway = null;
    contract = null;
    console.log("[FabricConnect]: Disconnected from Fabric Gateway");
  }
}
