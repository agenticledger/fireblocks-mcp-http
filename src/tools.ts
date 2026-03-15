import { z } from 'zod';
import { FireblocksClient } from './api-client.js';

interface ToolDef {
  name: string;
  description: string;
  inputSchema: z.ZodType<any>;
  handler: (client: FireblocksClient, args: any) => Promise<any>;
}

// Reusable pagination params
const paginationParams = {
  limit: z.number().optional().describe('max results'),
  before: z.string().optional().describe('cursor for previous page'),
  after: z.string().optional().describe('cursor for next page'),
};

export const tools: ToolDef[] = [
  // =========================================================================
  // VAULT ACCOUNTS (12 tools)
  // =========================================================================

  {
    name: 'vault_accounts_list',
    description: 'List vault accounts with optional filters',
    inputSchema: z.object({
      namePrefix: z.string().optional().describe('filter by name prefix'),
      nameSuffix: z.string().optional().describe('filter by name suffix'),
      minAmountThreshold: z.number().optional().describe('min balance threshold'),
      assetId: z.string().optional().describe('filter by asset ID'),
      orderBy: z.string().optional().describe('field to order results by'),
      ...paginationParams,
    }),
    handler: async (client, args) => client.listVaultAccounts(args),
  },

  {
    name: 'vault_account_create',
    description: 'Create a new vault account',
    inputSchema: z.object({
      name: z.string().describe('vault account name'),
      hiddenOnUI: z.boolean().optional().describe('hide from console UI'),
      customerRefId: z.string().optional().describe('external customer reference ID'),
      autoFuel: z.boolean().optional().describe('enable auto fueling'),
    }),
    handler: async (client, args) => client.createVaultAccount(args),
  },

  {
    name: 'vault_account_get',
    description: 'Get vault account by ID',
    inputSchema: z.object({
      vaultAccountId: z.string().describe('vault account ID'),
    }),
    handler: async (client, args) => client.getVaultAccount(args.vaultAccountId),
  },

  {
    name: 'vault_account_rename',
    description: 'Rename a vault account',
    inputSchema: z.object({
      vaultAccountId: z.string().describe('vault account ID'),
      name: z.string().describe('new vault account name'),
    }),
    handler: async (client, args) => client.renameVaultAccount(args.vaultAccountId, args.name),
  },

  {
    name: 'vault_account_hide',
    description: 'Hide a vault account from console UI',
    inputSchema: z.object({
      vaultAccountId: z.string().describe('vault account ID'),
    }),
    handler: async (client, args) => client.hideVaultAccount(args.vaultAccountId),
  },

  {
    name: 'vault_account_unhide',
    description: 'Unhide a vault account in console UI',
    inputSchema: z.object({
      vaultAccountId: z.string().describe('vault account ID'),
    }),
    handler: async (client, args) => client.unhideVaultAccount(args.vaultAccountId),
  },

  {
    name: 'vault_account_set_customer_ref',
    description: 'Set customer reference ID on vault account',
    inputSchema: z.object({
      vaultAccountId: z.string().describe('vault account ID'),
      customerRefId: z.string().describe('external customer reference ID'),
    }),
    handler: async (client, args) => client.setVaultAccountCustomerRefId(args.vaultAccountId, args.customerRefId),
  },

  {
    name: 'vault_account_set_auto_fuel',
    description: 'Enable or disable auto fuel for vault',
    inputSchema: z.object({
      vaultAccountId: z.string().describe('vault account ID'),
      autoFuel: z.boolean().describe('true to enable auto fueling'),
    }),
    handler: async (client, args) => client.setVaultAccountAutoFuel(args.vaultAccountId, args.autoFuel),
  },

  {
    name: 'vault_asset_wallets_list',
    description: 'List asset wallets across all vaults',
    inputSchema: z.object({
      totalAmountLargerThan: z.number().optional().describe('min total amount filter'),
      assetId: z.string().optional().describe('filter by asset ID'),
      orderBy: z.string().optional().describe('field to order results by'),
      ...paginationParams,
    }),
    handler: async (client, args) => client.getVaultAssetWallets(args),
  },

  {
    name: 'vault_bip44_max_index',
    description: 'Get max BIP44 address index used',
    inputSchema: z.object({
      vaultAccountId: z.string().describe('vault account ID'),
    }),
    handler: async (client, args) => client.getMaxBip44IndexUsed(args.vaultAccountId),
  },

  {
    name: 'vault_bulk_create',
    description: 'Bulk create multiple vault accounts',
    inputSchema: z.object({
      vaultAccounts: z.string().describe('JSON array: [{name, hiddenOnUI?, customerRefId?, autoFuel?}]'),
    }),
    handler: async (client, args) => client.bulkCreateVaultAccounts({ vaultAccounts: JSON.parse(args.vaultAccounts) }),
  },

  {
    name: 'vault_bulk_create_status',
    description: 'Get status of bulk vault creation job',
    inputSchema: z.object({
      jobId: z.string().describe('bulk creation job ID'),
    }),
    handler: async (client, args) => client.getBulkCreateVaultAccountsStatus(args.jobId),
  },

  // =========================================================================
  // VAULT WALLETS & ASSETS (14 tools)
  // =========================================================================

  {
    name: 'vault_asset_get',
    description: 'Get specific asset in a vault account',
    inputSchema: z.object({
      vaultAccountId: z.string().describe('vault account ID'),
      assetId: z.string().describe('asset ID (e.g. BTC, ETH)'),
    }),
    handler: async (client, args) => client.getVaultAccountAsset(args.vaultAccountId, args.assetId),
  },

  {
    name: 'vault_wallet_create',
    description: 'Create asset wallet in a vault account',
    inputSchema: z.object({
      vaultAccountId: z.string().describe('vault account ID'),
      assetId: z.string().describe('asset ID to add (e.g. BTC, ETH)'),
      eosAccountName: z.string().optional().describe('EOS account name if applicable'),
    }),
    handler: async (client, args) => client.createVaultWallet(args.vaultAccountId, args.assetId, args.eosAccountName),
  },

  {
    name: 'vault_wallet_activate',
    description: 'Activate an asset wallet in a vault',
    inputSchema: z.object({
      vaultAccountId: z.string().describe('vault account ID'),
      assetId: z.string().describe('asset ID to activate'),
    }),
    handler: async (client, args) => client.activateVaultWallet(args.vaultAccountId, args.assetId),
  },

  {
    name: 'vault_asset_refresh_balance',
    description: 'Refresh balance for a vault asset',
    inputSchema: z.object({
      vaultAccountId: z.string().describe('vault account ID'),
      assetId: z.string().describe('asset ID to refresh'),
    }),
    handler: async (client, args) => client.refreshVaultAssetBalance(args.vaultAccountId, args.assetId),
  },

  {
    name: 'vault_asset_addresses',
    description: 'Get deposit addresses for vault asset',
    inputSchema: z.object({
      vaultAccountId: z.string().describe('vault account ID'),
      assetId: z.string().describe('asset ID'),
    }),
    handler: async (client, args) => client.getVaultAssetAddresses(args.vaultAccountId, args.assetId),
  },

  {
    name: 'vault_deposit_address_create',
    description: 'Create new deposit address for vault asset',
    inputSchema: z.object({
      vaultAccountId: z.string().describe('vault account ID'),
      assetId: z.string().describe('asset ID'),
      description: z.string().optional().describe('address description'),
      customerRefId: z.string().optional().describe('external customer reference ID'),
    }),
    handler: async (client, args) => {
      const { vaultAccountId, assetId, ...data } = args;
      return client.createDepositAddress(vaultAccountId, assetId, data);
    },
  },

  {
    name: 'vault_asset_addresses_paged',
    description: 'Get paginated deposit addresses for asset',
    inputSchema: z.object({
      vaultAccountId: z.string().describe('vault account ID'),
      assetId: z.string().describe('asset ID'),
      ...paginationParams,
    }),
    handler: async (client, args) => {
      const { vaultAccountId, assetId, ...params } = args;
      return client.getVaultAssetAddressesPaginated(vaultAccountId, assetId, params);
    },
  },

  {
    name: 'vault_max_spendable',
    description: 'Get max spendable amount for vault asset',
    inputSchema: z.object({
      vaultAccountId: z.string().describe('vault account ID'),
      assetId: z.string().describe('asset ID'),
    }),
    handler: async (client, args) => client.getMaxSpendableAmount(args.vaultAccountId, args.assetId),
  },

  {
    name: 'vault_deposit_address_update',
    description: 'Update deposit address description/tag',
    inputSchema: z.object({
      vaultAccountId: z.string().describe('vault account ID'),
      assetId: z.string().describe('asset ID'),
      addressId: z.string().describe('deposit address ID'),
      description: z.string().optional().describe('new address description'),
      tag: z.string().optional().describe('new address tag/memo'),
    }),
    handler: async (client, args) => {
      const { vaultAccountId, assetId, addressId, ...data } = args;
      return client.updateDepositAddressDescription(vaultAccountId, assetId, addressId, data);
    },
  },

  {
    name: 'vault_unspent_inputs',
    description: 'Get UTXO unspent inputs for vault asset',
    inputSchema: z.object({
      vaultAccountId: z.string().describe('vault account ID'),
      assetId: z.string().describe('asset ID (UTXO-based asset)'),
    }),
    handler: async (client, args) => client.getUnspentInputs(args.vaultAccountId, args.assetId),
  },

  {
    name: 'vault_balance_by_asset',
    description: 'Get total vault balance for one asset',
    inputSchema: z.object({
      assetId: z.string().describe('asset ID'),
    }),
    handler: async (client, args) => client.getVaultBalanceByAsset(args.assetId),
  },

  {
    name: 'vault_assets_list',
    description: 'List all vault asset balances',
    inputSchema: z.object({
      accountNamePrefix: z.string().optional().describe('filter by account name prefix'),
      accountNameSuffix: z.string().optional().describe('filter by account name suffix'),
    }),
    handler: async (client, args) => client.getVaultAssets(args),
  },

  {
    name: 'vault_public_key_info',
    description: 'Get public key info by derivation path',
    inputSchema: z.object({
      derivationPath: z.string().describe('BIP44 derivation path'),
      algorithm: z.string().describe('signing algorithm (e.g. ECDSA_SECP256K1)'),
      compressed: z.boolean().optional().describe('return compressed public key'),
    }),
    handler: async (client, args) => client.getPublicKeyInfo(args),
  },

  {
    name: 'vault_asset_public_key',
    description: 'Get public key for vault asset address',
    inputSchema: z.object({
      vaultAccountId: z.string().describe('vault account ID'),
      assetId: z.string().describe('asset ID'),
      change: z.number().describe('BIP44 change index (0 or 1)'),
      addressIndex: z.number().describe('BIP44 address index'),
      compressed: z.boolean().optional().describe('return compressed public key'),
    }),
    handler: async (client, args) => {
      const { vaultAccountId, assetId, change, addressIndex, compressed } = args;
      return client.getAssetPublicKey(vaultAccountId, assetId, change, addressIndex, compressed !== undefined ? { compressed } : undefined);
    },
  },

  // =========================================================================
  // TRANSACTIONS (14 tools)
  // =========================================================================

  {
    name: 'transaction_list',
    description: 'List transactions with filters',
    inputSchema: z.object({
      before: z.string().optional().describe('cursor for previous page'),
      after: z.string().optional().describe('cursor for next page'),
      status: z.string().optional().describe('filter by status'),
      orderBy: z.string().optional().describe('field to order by'),
      sort: z.string().optional().describe('sort direction (ASC or DESC)'),
      limit: z.number().optional().describe('max results'),
      sourceType: z.string().optional().describe('filter by source type'),
      sourceId: z.string().optional().describe('filter by source ID'),
      destType: z.string().optional().describe('filter by destination type'),
      destId: z.string().optional().describe('filter by destination ID'),
      assets: z.string().optional().describe('filter by asset ID'),
      txHash: z.string().optional().describe('filter by transaction hash'),
    }),
    handler: async (client, args) => client.listTransactions(args),
  },

  {
    name: 'transaction_create',
    description: 'Create a new transaction',
    inputSchema: z.object({
      assetId: z.string().describe('asset ID (e.g. BTC, ETH)'),
      source: z.string().describe('JSON: {type, id?, name?}'),
      destination: z.string().describe('JSON: {type, id?, oneTimeAddress?: {address, tag?}}'),
      amount: z.string().describe('amount to transfer'),
      fee: z.string().optional().describe('transaction fee'),
      feeLevel: z.string().optional().describe('fee level: LOW, MEDIUM, HIGH'),
      note: z.string().optional().describe('transaction note'),
      operation: z.string().optional().describe('operation type (TRANSFER, etc.)'),
      customerRefId: z.string().optional().describe('external customer reference ID'),
      treatAsGrossAmount: z.boolean().optional().describe('treat amount as gross (fee included)'),
      forceSweep: z.boolean().optional().describe('force sweep entire balance'),
    }),
    handler: async (client, args) => {
      const { source, destination, ...rest } = args;
      return client.createTransaction({
        ...rest,
        source: JSON.parse(source),
        destination: JSON.parse(destination),
      });
    },
  },

  {
    name: 'transaction_get',
    description: 'Get transaction details by ID',
    inputSchema: z.object({
      txId: z.string().describe('transaction ID'),
    }),
    handler: async (client, args) => client.getTransaction(args.txId),
  },

  {
    name: 'transaction_get_by_external_id',
    description: 'Get transaction by external TX ID',
    inputSchema: z.object({
      externalTxId: z.string().describe('external transaction ID'),
    }),
    handler: async (client, args) => client.getTransactionByExternalId(args.externalTxId),
  },

  {
    name: 'transaction_cancel',
    description: 'Cancel a pending transaction',
    inputSchema: z.object({
      txId: z.string().describe('transaction ID to cancel'),
    }),
    handler: async (client, args) => client.cancelTransaction(args.txId),
  },

  {
    name: 'transaction_freeze',
    description: 'Freeze a transaction',
    inputSchema: z.object({
      txId: z.string().describe('transaction ID to freeze'),
    }),
    handler: async (client, args) => client.freezeTransaction(args.txId),
  },

  {
    name: 'transaction_unfreeze',
    description: 'Unfreeze a frozen transaction',
    inputSchema: z.object({
      txId: z.string().describe('transaction ID to unfreeze'),
    }),
    handler: async (client, args) => client.unfreezeTransaction(args.txId),
  },

  {
    name: 'transaction_drop',
    description: 'Drop a stuck transaction (RBF)',
    inputSchema: z.object({
      txId: z.string().describe('transaction ID to drop'),
      feeLevel: z.string().optional().describe('fee level for replacement tx'),
      requestedFee: z.string().optional().describe('specific fee for replacement tx'),
    }),
    handler: async (client, args) => {
      const { txId, ...data } = args;
      return client.dropTransaction(txId, data);
    },
  },

  {
    name: 'transaction_set_confirmation_threshold',
    description: 'Set confirmation threshold for a tx',
    inputSchema: z.object({
      txId: z.string().describe('transaction ID'),
      numOfConfirmations: z.number().describe('required number of confirmations'),
    }),
    handler: async (client, args) => client.setTransactionConfirmationThreshold(args.txId, args.numOfConfirmations),
  },

  {
    name: 'transaction_set_threshold_by_hash',
    description: 'Set confirmation threshold by tx hash',
    inputSchema: z.object({
      txHash: z.string().describe('blockchain transaction hash'),
      numOfConfirmations: z.number().describe('required number of confirmations'),
    }),
    handler: async (client, args) => client.setConfirmationThresholdByTxHash(args.txHash, args.numOfConfirmations),
  },

  {
    name: 'transaction_estimate_fee',
    description: 'Estimate fee for a transaction',
    inputSchema: z.object({
      assetId: z.string().describe('asset ID'),
      amount: z.string().describe('transfer amount'),
      source: z.string().describe('JSON: {type, id?}'),
      destination: z.string().describe('JSON: {type, id?, oneTimeAddress?: {address}}'),
      operation: z.string().optional().describe('operation type'),
    }),
    handler: async (client, args) => {
      const { source, destination, ...rest } = args;
      return client.estimateTransactionFee({
        ...rest,
        source: JSON.parse(source),
        destination: JSON.parse(destination),
      });
    },
  },

  {
    name: 'network_fee_estimate',
    description: 'Estimate network fee for an asset',
    inputSchema: z.object({
      assetId: z.string().describe('asset ID to estimate fees for'),
    }),
    handler: async (client, args) => client.estimateNetworkFee(args.assetId),
  },

  {
    name: 'address_validate',
    description: 'Validate a blockchain address',
    inputSchema: z.object({
      assetId: z.string().describe('asset ID for address format'),
      address: z.string().describe('blockchain address to validate'),
    }),
    handler: async (client, args) => client.validateAddress(args.assetId, args.address),
  },

  // =========================================================================
  // BLOCKCHAINS & ASSETS (7 tools)
  // =========================================================================

  {
    name: 'assets_list',
    description: 'List all supported assets',
    inputSchema: z.object({}),
    handler: async (client) => client.listSupportedAssets(),
  },

  {
    name: 'asset_register',
    description: 'Register a new asset',
    inputSchema: z.object({
      blockchainId: z.string().describe('blockchain ID to register on'),
      address: z.string().optional().describe('token contract address'),
      symbol: z.string().optional().describe('token symbol'),
    }),
    handler: async (client, args) => client.registerAsset(args),
  },

  {
    name: 'asset_get',
    description: 'Get asset details by ID',
    inputSchema: z.object({
      assetId: z.string().describe('asset ID'),
    }),
    handler: async (client, args) => client.getAsset(args.assetId),
  },

  {
    name: 'asset_update_metadata',
    description: 'Update asset alias or issuer name',
    inputSchema: z.object({
      assetId: z.string().describe('asset ID'),
      alias: z.string().optional().describe('new asset alias'),
      issuerName: z.string().optional().describe('new issuer name'),
    }),
    handler: async (client, args) => {
      const { assetId, ...data } = args;
      return client.updateAssetMetadata(assetId, data);
    },
  },

  {
    name: 'asset_set_price',
    description: 'Set custom price for an asset',
    inputSchema: z.object({
      assetId: z.string().describe('asset ID'),
      currency: z.string().describe('price currency (e.g. USD)'),
      price: z.number().describe('price value'),
    }),
    handler: async (client, args) => {
      const { assetId, ...data } = args;
      return client.setAssetPrice(assetId, data);
    },
  },

  {
    name: 'blockchains_list',
    description: 'List all supported blockchains',
    inputSchema: z.object({}),
    handler: async (client) => client.listBlockchains(),
  },

  {
    name: 'blockchain_get',
    description: 'Get blockchain details by ID',
    inputSchema: z.object({
      blockchainId: z.string().describe('blockchain ID'),
    }),
    handler: async (client, args) => client.getBlockchain(args.blockchainId),
  },

  // =========================================================================
  // EXCHANGE ACCOUNTS (5 tools)
  // =========================================================================

  {
    name: 'exchange_accounts_list',
    description: 'List all exchange accounts',
    inputSchema: z.object({}),
    handler: async (client) => client.listExchangeAccounts(),
  },

  {
    name: 'exchange_account_get',
    description: 'Get exchange account by ID',
    inputSchema: z.object({
      exchangeAccountId: z.string().describe('exchange account ID'),
    }),
    handler: async (client, args) => client.getExchangeAccount(args.exchangeAccountId),
  },

  {
    name: 'exchange_account_asset_get',
    description: 'Get asset in an exchange account',
    inputSchema: z.object({
      exchangeAccountId: z.string().describe('exchange account ID'),
      assetId: z.string().describe('asset ID'),
    }),
    handler: async (client, args) => client.getExchangeAccountAsset(args.exchangeAccountId, args.assetId),
  },

  {
    name: 'exchange_internal_transfer',
    description: 'Transfer within exchange sub-accounts',
    inputSchema: z.object({
      exchangeAccountId: z.string().describe('exchange account ID'),
      asset: z.string().describe('asset to transfer'),
      amount: z.string().describe('amount to transfer'),
      sourceType: z.string().describe('source sub-account type'),
      destType: z.string().describe('destination sub-account type'),
    }),
    handler: async (client, args) => {
      const { exchangeAccountId, ...data } = args;
      return client.internalTransfer(exchangeAccountId, data);
    },
  },

  {
    name: 'exchange_convert',
    description: 'Convert between assets on exchange',
    inputSchema: z.object({
      exchangeAccountId: z.string().describe('exchange account ID'),
      srcAsset: z.string().describe('source asset ID'),
      destAsset: z.string().describe('destination asset ID'),
      amount: z.number().describe('amount to convert'),
    }),
    handler: async (client, args) => {
      const { exchangeAccountId, ...data } = args;
      return client.convertExchangeFunds(exchangeAccountId, data);
    },
  },

  // =========================================================================
  // FIAT ACCOUNTS (4 tools)
  // =========================================================================

  {
    name: 'fiat_accounts_list',
    description: 'List all fiat accounts',
    inputSchema: z.object({}),
    handler: async (client) => client.listFiatAccounts(),
  },

  {
    name: 'fiat_account_get',
    description: 'Get fiat account by ID',
    inputSchema: z.object({
      accountId: z.string().describe('fiat account ID'),
    }),
    handler: async (client, args) => client.getFiatAccount(args.accountId),
  },

  {
    name: 'fiat_redeem_to_dda',
    description: 'Redeem fiat to linked bank (DDA)',
    inputSchema: z.object({
      accountId: z.string().describe('fiat account ID'),
      amount: z.number().describe('amount to redeem'),
      asset: z.string().optional().describe('fiat asset (e.g. USD)'),
    }),
    handler: async (client, args) => {
      const { accountId, ...data } = args;
      return client.redeemFundsToLinkedDDA(accountId, data);
    },
  },

  {
    name: 'fiat_deposit_from_dda',
    description: 'Deposit fiat from linked bank (DDA)',
    inputSchema: z.object({
      accountId: z.string().describe('fiat account ID'),
      amount: z.number().describe('amount to deposit'),
      asset: z.string().optional().describe('fiat asset (e.g. USD)'),
    }),
    handler: async (client, args) => {
      const { accountId, ...data } = args;
      return client.depositFundsFromLinkedDDA(accountId, data);
    },
  },

  // =========================================================================
  // INTERNAL WALLETS (7 tools)
  // =========================================================================

  {
    name: 'internal_wallets_list',
    description: 'List all internal wallets',
    inputSchema: z.object({}),
    handler: async (client) => client.listInternalWallets(),
  },

  {
    name: 'internal_wallet_create',
    description: 'Create a new internal wallet',
    inputSchema: z.object({
      name: z.string().describe('wallet name'),
      customerRefId: z.string().optional().describe('external customer reference ID'),
    }),
    handler: async (client, args) => client.createInternalWallet(args),
  },

  {
    name: 'internal_wallet_get',
    description: 'Get internal wallet by ID',
    inputSchema: z.object({
      walletId: z.string().describe('internal wallet ID'),
    }),
    handler: async (client, args) => client.getInternalWallet(args.walletId),
  },

  {
    name: 'internal_wallet_delete',
    description: 'Delete an internal wallet',
    inputSchema: z.object({
      walletId: z.string().describe('internal wallet ID'),
    }),
    handler: async (client, args) => client.deleteInternalWallet(args.walletId),
  },

  {
    name: 'internal_wallet_asset_get',
    description: 'Get asset in an internal wallet',
    inputSchema: z.object({
      walletId: z.string().describe('internal wallet ID'),
      assetId: z.string().describe('asset ID'),
    }),
    handler: async (client, args) => client.getInternalWalletAsset(args.walletId, args.assetId),
  },

  {
    name: 'internal_wallet_asset_add',
    description: 'Add asset to an internal wallet',
    inputSchema: z.object({
      walletId: z.string().describe('internal wallet ID'),
      assetId: z.string().describe('asset ID'),
      address: z.string().describe('blockchain address'),
      tag: z.string().optional().describe('address tag/memo'),
    }),
    handler: async (client, args) => {
      const { walletId, assetId, ...data } = args;
      return client.addInternalWalletAsset(walletId, assetId, data);
    },
  },

  {
    name: 'internal_wallet_asset_delete',
    description: 'Remove asset from an internal wallet',
    inputSchema: z.object({
      walletId: z.string().describe('internal wallet ID'),
      assetId: z.string().describe('asset ID'),
    }),
    handler: async (client, args) => client.deleteInternalWalletAsset(args.walletId, args.assetId),
  },

  // =========================================================================
  // EXTERNAL WALLETS (7 tools)
  // =========================================================================

  {
    name: 'external_wallets_list',
    description: 'List all external wallets',
    inputSchema: z.object({}),
    handler: async (client) => client.listExternalWallets(),
  },

  {
    name: 'external_wallet_create',
    description: 'Create a new external wallet',
    inputSchema: z.object({
      name: z.string().describe('wallet name'),
      customerRefId: z.string().optional().describe('external customer reference ID'),
    }),
    handler: async (client, args) => client.createExternalWallet(args),
  },

  {
    name: 'external_wallet_get',
    description: 'Get external wallet by ID',
    inputSchema: z.object({
      walletId: z.string().describe('external wallet ID'),
    }),
    handler: async (client, args) => client.getExternalWallet(args.walletId),
  },

  {
    name: 'external_wallet_delete',
    description: 'Delete an external wallet',
    inputSchema: z.object({
      walletId: z.string().describe('external wallet ID'),
    }),
    handler: async (client, args) => client.deleteExternalWallet(args.walletId),
  },

  {
    name: 'external_wallet_asset_get',
    description: 'Get asset in an external wallet',
    inputSchema: z.object({
      walletId: z.string().describe('external wallet ID'),
      assetId: z.string().describe('asset ID'),
    }),
    handler: async (client, args) => client.getExternalWalletAsset(args.walletId, args.assetId),
  },

  {
    name: 'external_wallet_asset_add',
    description: 'Add asset to an external wallet',
    inputSchema: z.object({
      walletId: z.string().describe('external wallet ID'),
      assetId: z.string().describe('asset ID'),
      address: z.string().describe('blockchain address'),
      tag: z.string().optional().describe('address tag/memo'),
    }),
    handler: async (client, args) => {
      const { walletId, assetId, ...data } = args;
      return client.addExternalWalletAsset(walletId, assetId, data);
    },
  },

  {
    name: 'external_wallet_asset_delete',
    description: 'Remove asset from an external wallet',
    inputSchema: z.object({
      walletId: z.string().describe('external wallet ID'),
      assetId: z.string().describe('asset ID'),
    }),
    handler: async (client, args) => client.deleteExternalWalletAsset(args.walletId, args.assetId),
  },

  // =========================================================================
  // STAKING (12 tools)
  // =========================================================================

  {
    name: 'staking_chains_list',
    description: 'List chains that support staking',
    inputSchema: z.object({}),
    handler: async (client) => client.listStakingChains(),
  },

  {
    name: 'staking_chain_info',
    description: 'Get staking info for a chain',
    inputSchema: z.object({
      chainDescriptor: z.string().describe('chain descriptor (e.g. ETH, SOL)'),
    }),
    handler: async (client, args) => client.getStakingChainInfo(args.chainDescriptor),
  },

  {
    name: 'staking_stake',
    description: 'Stake assets via a provider',
    inputSchema: z.object({
      vaultAccountId: z.string().describe('source vault account ID'),
      providerId: z.string().describe('staking provider ID'),
      stakeAmount: z.string().describe('amount to stake'),
      txNote: z.string().optional().describe('transaction note'),
      feeLevel: z.string().optional().describe('fee level: LOW, MEDIUM, HIGH'),
    }),
    handler: async (client, args) => client.stake(args),
  },

  {
    name: 'staking_unstake',
    description: 'Unstake a staking position',
    inputSchema: z.object({
      id: z.string().describe('staking position ID'),
      txNote: z.string().optional().describe('transaction note'),
      feeLevel: z.string().optional().describe('fee level: LOW, MEDIUM, HIGH'),
    }),
    handler: async (client, args) => client.unstake(args),
  },

  {
    name: 'staking_withdraw',
    description: 'Withdraw from staking position',
    inputSchema: z.object({
      id: z.string().describe('staking position ID'),
      txNote: z.string().optional().describe('transaction note'),
      feeLevel: z.string().optional().describe('fee level: LOW, MEDIUM, HIGH'),
    }),
    handler: async (client, args) => client.withdrawStaking(args),
  },

  {
    name: 'staking_claim_rewards',
    description: 'Claim staking rewards',
    inputSchema: z.object({
      id: z.string().describe('staking position ID'),
      txNote: z.string().optional().describe('transaction note'),
      feeLevel: z.string().optional().describe('fee level: LOW, MEDIUM, HIGH'),
    }),
    handler: async (client, args) => client.claimStakingRewards(args),
  },

  {
    name: 'staking_positions_list',
    description: 'List all staking positions',
    inputSchema: z.object({}),
    handler: async (client) => client.listStakingPositions(),
  },

  {
    name: 'staking_positions_summary',
    description: 'Get summary of all staking positions',
    inputSchema: z.object({}),
    handler: async (client) => client.getStakingPositionsSummary(),
  },

  {
    name: 'staking_positions_summary_by_vault',
    description: 'Get staking summary grouped by vault',
    inputSchema: z.object({}),
    handler: async (client) => client.getStakingPositionsSummaryByVault(),
  },

  {
    name: 'staking_position_get',
    description: 'Get staking position by ID',
    inputSchema: z.object({
      positionId: z.string().describe('staking position ID'),
    }),
    handler: async (client, args) => client.getStakingPosition(args.positionId),
  },

  {
    name: 'staking_providers_list',
    description: 'List available staking providers',
    inputSchema: z.object({}),
    handler: async (client) => client.listStakingProviders(),
  },

  {
    name: 'staking_approve_provider_terms',
    description: 'Approve staking provider terms',
    inputSchema: z.object({
      providerId: z.string().describe('staking provider ID'),
    }),
    handler: async (client, args) => client.approveStakingProviderTerms(args),
  },

  // =========================================================================
  // GAS STATIONS (4 tools)
  // =========================================================================

  {
    name: 'gas_station_settings',
    description: 'Get gas station configuration',
    inputSchema: z.object({}),
    handler: async (client) => client.getGasStationSettings(),
  },

  {
    name: 'gas_station_settings_by_asset',
    description: 'Get gas station config for an asset',
    inputSchema: z.object({
      assetId: z.string().describe('asset ID'),
    }),
    handler: async (client, args) => client.getGasStationSettingsByAsset(args.assetId),
  },

  {
    name: 'gas_station_update',
    description: 'Update gas station configuration',
    inputSchema: z.object({
      gasThreshold: z.string().describe('gas balance threshold'),
      gasCap: z.string().describe('max gas to fund'),
      maxGasPrice: z.string().optional().describe('max gas price allowed'),
    }),
    handler: async (client, args) => client.updateGasStationSettings(args),
  },

  {
    name: 'gas_station_update_by_asset',
    description: 'Update gas station config for an asset',
    inputSchema: z.object({
      assetId: z.string().describe('asset ID'),
      gasThreshold: z.string().describe('gas balance threshold'),
      gasCap: z.string().describe('max gas to fund'),
      maxGasPrice: z.string().optional().describe('max gas price allowed'),
    }),
    handler: async (client, args) => {
      const { assetId, ...data } = args;
      return client.updateGasStationSettingsByAsset(assetId, data);
    },
  },

  // =========================================================================
  // NETWORK CONNECTIONS (8 tools)
  // =========================================================================

  {
    name: 'network_connections_list',
    description: 'List all network connections',
    inputSchema: z.object({}),
    handler: async (client) => client.listNetworkConnections(),
  },

  {
    name: 'network_connection_create',
    description: 'Create a network connection',
    inputSchema: z.object({
      localNetworkId: z.string().describe('local network ID'),
      remoteNetworkId: z.string().describe('remote network ID'),
      routingPolicy: z.string().optional().describe('JSON: routing policy object'),
    }),
    handler: async (client, args) => {
      const { routingPolicy, ...rest } = args;
      return client.createNetworkConnection({
        ...rest,
        routingPolicy: routingPolicy ? JSON.parse(routingPolicy) : undefined,
      });
    },
  },

  {
    name: 'network_connection_get',
    description: 'Get network connection by ID',
    inputSchema: z.object({
      connectionId: z.string().describe('network connection ID'),
    }),
    handler: async (client, args) => client.getNetworkConnection(args.connectionId),
  },

  {
    name: 'network_connection_delete',
    description: 'Delete a network connection',
    inputSchema: z.object({
      connectionId: z.string().describe('network connection ID'),
    }),
    handler: async (client, args) => client.deleteNetworkConnection(args.connectionId),
  },

  {
    name: 'network_ids_list',
    description: 'List all network IDs',
    inputSchema: z.object({}),
    handler: async (client) => client.listNetworkIds(),
  },

  {
    name: 'network_id_create',
    description: 'Create a new network ID',
    inputSchema: z.object({
      name: z.string().describe('network ID name'),
      routingPolicy: z.string().optional().describe('JSON: routing policy object'),
    }),
    handler: async (client, args) => {
      const { routingPolicy, ...rest } = args;
      return client.createNetworkId({
        ...rest,
        routingPolicy: routingPolicy ? JSON.parse(routingPolicy) : undefined,
      });
    },
  },

  {
    name: 'network_id_get',
    description: 'Get network ID details',
    inputSchema: z.object({
      networkId: z.string().describe('network ID'),
    }),
    handler: async (client, args) => client.getNetworkId(args.networkId),
  },

  {
    name: 'network_id_delete',
    description: 'Delete a network ID',
    inputSchema: z.object({
      networkId: z.string().describe('network ID'),
    }),
    handler: async (client, args) => client.deleteNetworkId(args.networkId),
  },

  // =========================================================================
  // CONTRACTS - WHITELISTED (6 tools)
  // =========================================================================

  {
    name: 'contracts_list',
    description: 'List all whitelisted contracts',
    inputSchema: z.object({}),
    handler: async (client) => client.listWhitelistedContracts(),
  },

  {
    name: 'contract_add',
    description: 'Add a whitelisted contract',
    inputSchema: z.object({
      name: z.string().describe('contract name'),
      assets: z.string().optional().describe('JSON array: [{id, address, tag?}]'),
    }),
    handler: async (client, args) => {
      const { assets, ...rest } = args;
      return client.addWhitelistedContract({
        ...rest,
        assets: assets ? JSON.parse(assets) : undefined,
      });
    },
  },

  {
    name: 'contract_get',
    description: 'Get whitelisted contract by ID',
    inputSchema: z.object({
      contractId: z.string().describe('whitelisted contract ID'),
    }),
    handler: async (client, args) => client.getWhitelistedContract(args.contractId),
  },

  {
    name: 'contract_delete',
    description: 'Delete a whitelisted contract',
    inputSchema: z.object({
      contractId: z.string().describe('whitelisted contract ID'),
    }),
    handler: async (client, args) => client.deleteWhitelistedContract(args.contractId),
  },

  {
    name: 'contract_asset_add',
    description: 'Add asset to a whitelisted contract',
    inputSchema: z.object({
      contractId: z.string().describe('whitelisted contract ID'),
      assetId: z.string().describe('asset ID'),
      address: z.string().describe('contract address for this asset'),
      tag: z.string().optional().describe('address tag/memo'),
    }),
    handler: async (client, args) => {
      const { contractId, assetId, ...data } = args;
      return client.addWhitelistedContractAsset(contractId, assetId, data);
    },
  },

  {
    name: 'contract_asset_delete',
    description: 'Remove asset from whitelisted contract',
    inputSchema: z.object({
      contractId: z.string().describe('whitelisted contract ID'),
      assetId: z.string().describe('asset ID'),
    }),
    handler: async (client, args) => client.deleteWhitelistedContractAsset(args.contractId, args.assetId),
  },

  // =========================================================================
  // SMART CONTRACTS & INTERACTIONS (5 tools)
  // =========================================================================

  {
    name: 'deployed_contracts_list',
    description: 'List all deployed contracts',
    inputSchema: z.object({}),
    handler: async (client) => client.listDeployedContracts(),
  },

  {
    name: 'deployed_contract_get',
    description: 'Get deployed contract by ID',
    inputSchema: z.object({
      contractId: z.string().describe('deployed contract ID'),
    }),
    handler: async (client, args) => client.getDeployedContract(args.contractId),
  },

  {
    name: 'contract_abi_fetch',
    description: 'Fetch ABI for a contract address',
    inputSchema: z.object({
      contractAddress: z.string().describe('on-chain contract address'),
      blockchainId: z.string().describe('blockchain ID'),
    }),
    handler: async (client, args) => client.fetchContractAbi(args),
  },

  {
    name: 'contract_read',
    description: 'Read from a smart contract function',
    inputSchema: z.object({
      contractAddress: z.string().describe('on-chain contract address'),
      abiFunction: z.string().describe('JSON: ABI function definition with args'),
      blockchainId: z.string().describe('blockchain ID'),
      vaultAccountId: z.string().optional().describe('vault account ID for context'),
      amount: z.string().optional().describe('amount to send with call'),
      feeLevel: z.string().optional().describe('fee level: LOW, MEDIUM, HIGH'),
    }),
    handler: async (client, args) => {
      const { abiFunction, ...rest } = args;
      return client.readContractFunction({
        ...rest,
        abiFunction: JSON.parse(abiFunction),
      });
    },
  },

  {
    name: 'contract_write',
    description: 'Write to a smart contract function',
    inputSchema: z.object({
      contractAddress: z.string().describe('on-chain contract address'),
      abiFunction: z.string().describe('JSON: ABI function definition with args'),
      blockchainId: z.string().describe('blockchain ID'),
      vaultAccountId: z.string().describe('vault account ID for signing'),
      amount: z.string().optional().describe('amount to send with call'),
      feeLevel: z.string().optional().describe('fee level: LOW, MEDIUM, HIGH'),
      note: z.string().optional().describe('transaction note'),
    }),
    handler: async (client, args) => {
      const { abiFunction, ...rest } = args;
      return client.writeContractFunction({
        ...rest,
        abiFunction: JSON.parse(abiFunction),
      });
    },
  },

  // =========================================================================
  // TOKENIZATION (9 tools)
  // =========================================================================

  {
    name: 'token_issue',
    description: 'Issue a new token',
    inputSchema: z.object({
      blockchainId: z.string().describe('blockchain ID to deploy on'),
      vaultAccountId: z.string().describe('vault account ID for deployment'),
      contractId: z.string().optional().describe('existing contract template ID'),
      name: z.string().optional().describe('token name'),
      symbol: z.string().optional().describe('token symbol'),
    }),
    handler: async (client, args) => client.issueToken(args),
  },

  {
    name: 'tokens_list',
    description: 'List linked tokens',
    inputSchema: z.object({
      limit: z.number().optional().describe('max results'),
      offset: z.number().optional().describe('results offset'),
      status: z.string().optional().describe('filter by status'),
    }),
    handler: async (client, args) => client.listLinkedTokens(args),
  },

  {
    name: 'token_get',
    description: 'Get linked token by ID',
    inputSchema: z.object({
      tokenId: z.string().describe('token ID'),
    }),
    handler: async (client, args) => client.getLinkedToken(args.tokenId),
  },

  {
    name: 'token_unlink',
    description: 'Unlink a token',
    inputSchema: z.object({
      tokenId: z.string().describe('token ID to unlink'),
    }),
    handler: async (client, args) => client.unlinkToken(args.tokenId),
  },

  {
    name: 'token_link_contract',
    description: 'Link a contract to a token',
    inputSchema: z.object({
      contractId: z.string().describe('contract ID to link'),
      assetId: z.string().describe('asset ID to link'),
    }),
    handler: async (client, args) => client.linkContract(args),
  },

  {
    name: 'collections_list',
    description: 'List token collections',
    inputSchema: z.object({
      limit: z.number().optional().describe('max results'),
      offset: z.number().optional().describe('results offset'),
    }),
    handler: async (client, args) => client.listCollections(args),
  },

  {
    name: 'collection_get',
    description: 'Get token collection by ID',
    inputSchema: z.object({
      collectionId: z.string().describe('collection ID'),
    }),
    handler: async (client, args) => client.getCollection(args.collectionId),
  },

  {
    name: 'token_mint',
    description: 'Mint tokens from a contract',
    inputSchema: z.object({
      contractId: z.string().describe('token contract ID'),
      amount: z.string().describe('amount to mint'),
      vaultAccountId: z.string().describe('vault account ID for minting'),
      destinationAddress: z.string().optional().describe('destination address override'),
    }),
    handler: async (client, args) => client.mintTokens(args),
  },

  {
    name: 'token_burn',
    description: 'Burn tokens from a contract',
    inputSchema: z.object({
      contractId: z.string().describe('token contract ID'),
      amount: z.string().describe('amount to burn'),
      vaultAccountId: z.string().describe('vault account ID for burning'),
    }),
    handler: async (client, args) => client.burnTokens(args),
  },

  // =========================================================================
  // NFTs (6 tools)
  // =========================================================================

  {
    name: 'nfts_list',
    description: 'List owned NFTs',
    inputSchema: z.object({
      vaultAccountIds: z.string().optional().describe('comma-separated vault account IDs'),
      blockchainDescriptor: z.string().optional().describe('filter by blockchain'),
      limit: z.number().optional().describe('max results'),
      offset: z.number().optional().describe('results offset'),
      sort: z.string().optional().describe('sort field'),
      order: z.string().optional().describe('sort order (ASC or DESC)'),
    }),
    handler: async (client, args) => client.listOwnedNfts(args),
  },

  {
    name: 'nft_collections_list',
    description: 'List owned NFT collections',
    inputSchema: z.object({
      limit: z.number().optional().describe('max results'),
      offset: z.number().optional().describe('results offset'),
      search: z.string().optional().describe('search by name'),
    }),
    handler: async (client, args) => client.listOwnedCollections(args),
  },

  {
    name: 'nft_get',
    description: 'Get NFT by ID',
    inputSchema: z.object({
      id: z.string().describe('NFT token ID'),
    }),
    handler: async (client, args) => client.getNftById(args.id),
  },

  {
    name: 'nft_get_batch',
    description: 'Get multiple NFTs by IDs',
    inputSchema: z.object({
      ids: z.array(z.string()).describe('array of NFT token IDs'),
    }),
    handler: async (client, args) => client.getNftsByIds(args.ids),
  },

  {
    name: 'nft_refresh_metadata',
    description: 'Refresh metadata for an NFT',
    inputSchema: z.object({
      id: z.string().describe('NFT token ID'),
    }),
    handler: async (client, args) => client.refreshNftMetadata(args.id),
  },

  {
    name: 'nft_refresh_vault',
    description: 'Refresh NFTs in a vault account',
    inputSchema: z.object({
      vaultAccountId: z.string().describe('vault account ID'),
      blockchainDescriptor: z.string().describe('blockchain descriptor'),
      assetId: z.string().optional().describe('filter by asset ID'),
    }),
    handler: async (client, args) => {
      const { vaultAccountId, ...data } = args;
      return client.refreshVaultAccountNfts(vaultAccountId, data);
    },
  },

  // =========================================================================
  // WEBHOOKS (8 tools)
  // =========================================================================

  {
    name: 'webhook_create',
    description: 'Create a new webhook',
    inputSchema: z.object({
      url: z.string().describe('webhook callback URL'),
      events: z.array(z.string()).optional().describe('event types to subscribe to'),
      description: z.string().optional().describe('webhook description'),
    }),
    handler: async (client, args) => client.createWebhook(args),
  },

  {
    name: 'webhooks_list',
    description: 'List all webhooks',
    inputSchema: z.object({
      limit: z.number().optional().describe('max results'),
      cursor: z.string().optional().describe('pagination cursor'),
      order: z.string().optional().describe('sort order (ASC or DESC)'),
    }),
    handler: async (client, args) => client.listWebhooks(args),
  },

  {
    name: 'webhook_get',
    description: 'Get webhook by ID',
    inputSchema: z.object({
      webhookId: z.string().describe('webhook ID'),
    }),
    handler: async (client, args) => client.getWebhook(args.webhookId),
  },

  {
    name: 'webhook_update',
    description: 'Update a webhook',
    inputSchema: z.object({
      webhookId: z.string().describe('webhook ID'),
      url: z.string().optional().describe('new callback URL'),
      events: z.array(z.string()).optional().describe('new event types'),
      description: z.string().optional().describe('new description'),
      status: z.string().optional().describe('new status (ACTIVE, DISABLED)'),
    }),
    handler: async (client, args) => {
      const { webhookId, ...data } = args;
      return client.updateWebhook(webhookId, data);
    },
  },

  {
    name: 'webhook_delete',
    description: 'Delete a webhook',
    inputSchema: z.object({
      webhookId: z.string().describe('webhook ID'),
    }),
    handler: async (client, args) => client.deleteWebhook(args.webhookId),
  },

  {
    name: 'webhook_resend_notification',
    description: 'Resend a specific webhook notification',
    inputSchema: z.object({
      webhookId: z.string().describe('webhook ID'),
      notificationId: z.string().describe('notification ID to resend'),
    }),
    handler: async (client, args) => client.resendWebhookNotification(args.webhookId, args.notificationId),
  },

  {
    name: 'webhooks_resend_failed',
    description: 'Resend all failed webhook notifications',
    inputSchema: z.object({}),
    handler: async (client) => client.resendFailedWebhooks(),
  },

  {
    name: 'webhook_resend_for_tx',
    description: 'Resend webhooks for a transaction',
    inputSchema: z.object({
      txId: z.string().describe('transaction ID'),
      resendCreated: z.boolean().optional().describe('resend creation event'),
      resendStatusUpdated: z.boolean().optional().describe('resend status update events'),
    }),
    handler: async (client, args) => {
      const { txId, ...data } = args;
      return client.resendWebhooksForTransaction(txId, data);
    },
  },

  // =========================================================================
  // POLICY (5 tools)
  // =========================================================================

  {
    name: 'policy_active_get',
    description: 'Get the active policy rules',
    inputSchema: z.object({}),
    handler: async (client) => client.getActivePolicy(),
  },

  {
    name: 'policy_draft_get',
    description: 'Get the current policy draft',
    inputSchema: z.object({}),
    handler: async (client) => client.getActiveDraft(),
  },

  {
    name: 'policy_draft_update',
    description: 'Update the policy draft rules',
    inputSchema: z.object({
      rules: z.string().describe('JSON array: policy rules'),
    }),
    handler: async (client, args) => client.updateDraft({ rules: JSON.parse(args.rules) }),
  },

  {
    name: 'policy_draft_publish',
    description: 'Publish the current policy draft',
    inputSchema: z.object({}),
    handler: async (client) => client.publishDraft(),
  },

  {
    name: 'policy_rules_publish',
    description: 'Publish policy rules directly',
    inputSchema: z.object({
      rules: z.string().describe('JSON array: policy rules to publish'),
    }),
    handler: async (client, args) => client.publishPolicyRules({ rules: JSON.parse(args.rules) }),
  },

  // =========================================================================
  // USERS & AUDIT (2 tools)
  // =========================================================================

  {
    name: 'users_list',
    description: 'List all workspace users',
    inputSchema: z.object({}),
    handler: async (client) => client.listUsers(),
  },

  {
    name: 'audit_logs_get',
    description: 'Get audit logs for the workspace',
    inputSchema: z.object({
      timePeriod: z.string().optional().describe('time period filter'),
      cursor: z.string().optional().describe('pagination cursor'),
      limit: z.number().optional().describe('max results'),
    }),
    handler: async (client, args) => client.getAuditLogs(args),
  },

  // =========================================================================
  // WEB3 CONNECTIONS (4 tools)
  // =========================================================================

  {
    name: 'web3_connections_list',
    description: 'List WalletConnect sessions',
    inputSchema: z.object({
      limit: z.number().optional().describe('max results'),
      offset: z.number().optional().describe('results offset'),
      sort: z.string().optional().describe('sort field'),
      filter: z.string().optional().describe('filter expression'),
    }),
    handler: async (client, args) => client.listWeb3Connections(args),
  },

  {
    name: 'web3_connection_create',
    description: 'Create a WalletConnect session',
    inputSchema: z.object({
      vaultAccountId: z.number().describe('vault account ID (numeric)'),
      uri: z.string().describe('WalletConnect URI'),
      chainIds: z.array(z.string()).optional().describe('chain IDs to connect'),
      feeLevel: z.string().optional().describe('fee level: LOW, MEDIUM, HIGH'),
    }),
    handler: async (client, args) => client.createWeb3Connection(args),
  },

  {
    name: 'web3_connection_respond',
    description: 'Approve or reject a WC session request',
    inputSchema: z.object({
      connectionId: z.string().describe('WalletConnect connection ID'),
      approve: z.boolean().describe('true to approve, false to reject'),
    }),
    handler: async (client, args) => client.respondToWeb3ConnectionRequest(args.connectionId, { approve: args.approve }),
  },

  {
    name: 'web3_connection_remove',
    description: 'Remove a WalletConnect session',
    inputSchema: z.object({
      connectionId: z.string().describe('WalletConnect connection ID'),
    }),
    handler: async (client, args) => client.removeWeb3Connection(args.connectionId),
  },

  // =========================================================================
  // COMPLIANCE & TRAVEL RULE (9 tools)
  // =========================================================================

  {
    name: 'compliance_screening_policy',
    description: 'Get travel rule screening policy',
    inputSchema: z.object({}),
    handler: async (client) => client.getComplianceScreeningPolicy(),
  },

  {
    name: 'compliance_aml_policy',
    description: 'Get AML screening policy',
    inputSchema: z.object({}),
    handler: async (client) => client.getAmlScreeningPolicy(),
  },

  {
    name: 'compliance_travel_rule_update',
    description: 'Update travel rule configuration',
    inputSchema: z.object({
      data: z.string().describe('JSON: travel rule config object'),
    }),
    handler: async (client, args) => client.updateTravelRuleConfig(JSON.parse(args.data)),
  },

  {
    name: 'compliance_aml_update',
    description: 'Update AML screening configuration',
    inputSchema: z.object({
      data: z.string().describe('JSON: AML config object'),
    }),
    handler: async (client, args) => client.updateAmlConfig(JSON.parse(args.data)),
  },

  {
    name: 'compliance_transaction_details',
    description: 'Get compliance details for a tx',
    inputSchema: z.object({
      txId: z.string().describe('transaction ID'),
    }),
    handler: async (client, args) => client.getComplianceDetailsForTransaction(args.txId),
  },

  {
    name: 'travel_rule_validate',
    description: 'Validate a travel rule transaction',
    inputSchema: z.object({
      data: z.string().describe('JSON: travel rule transaction data'),
    }),
    handler: async (client, args) => client.validateTravelRuleTransaction(JSON.parse(args.data)),
  },

  {
    name: 'travel_rule_validate_full',
    description: 'Full travel rule tx validation',
    inputSchema: z.object({
      data: z.string().describe('JSON: full travel rule transaction data'),
    }),
    handler: async (client, args) => client.validateFullTravelRuleTransaction(JSON.parse(args.data)),
  },

  {
    name: 'vasps_list',
    description: 'List all VASPs',
    inputSchema: z.object({}),
    handler: async (client) => client.listVasps(),
  },

  {
    name: 'vasp_get',
    description: 'Get VASP by DID',
    inputSchema: z.object({
      vaspDid: z.string().describe('VASP decentralized identifier'),
    }),
    handler: async (client, args) => client.getVasp(args.vaspDid),
  },

  // =========================================================================
  // EMBEDDED WALLETS (9 tools)
  // =========================================================================

  {
    name: 'embedded_wallets_list',
    description: 'List embedded (NCW) wallets',
    inputSchema: z.object({
      limit: z.number().optional().describe('max results'),
      offset: z.number().optional().describe('results offset'),
    }),
    handler: async (client, args) => client.listEmbeddedWallets(args),
  },

  {
    name: 'embedded_wallet_create',
    description: 'Create an embedded (NCW) wallet',
    inputSchema: z.object({
      customerRefId: z.string().optional().describe('external customer reference ID'),
    }),
    handler: async (client, args) => client.createEmbeddedWallet(args),
  },

  {
    name: 'embedded_wallet_get',
    description: 'Get embedded wallet by ID',
    inputSchema: z.object({
      walletId: z.string().describe('embedded wallet ID'),
    }),
    handler: async (client, args) => client.getEmbeddedWallet(args.walletId),
  },

  {
    name: 'embedded_wallet_assets_list',
    description: 'List assets in an embedded wallet',
    inputSchema: z.object({
      walletId: z.string().describe('embedded wallet ID'),
      accountId: z.string().describe('account ID within wallet'),
      limit: z.number().optional().describe('max results'),
      offset: z.number().optional().describe('results offset'),
    }),
    handler: async (client, args) => {
      const { walletId, accountId, ...params } = args;
      return client.listEmbeddedWalletAssets(walletId, accountId, params);
    },
  },

  {
    name: 'embedded_wallet_balance',
    description: 'Get asset balance in embedded wallet',
    inputSchema: z.object({
      walletId: z.string().describe('embedded wallet ID'),
      accountId: z.string().describe('account ID within wallet'),
      assetId: z.string().describe('asset ID'),
    }),
    handler: async (client, args) => client.getEmbeddedWalletAssetBalance(args.walletId, args.accountId, args.assetId),
  },

  {
    name: 'embedded_wallet_account_create',
    description: 'Create account in embedded wallet',
    inputSchema: z.object({
      walletId: z.string().describe('embedded wallet ID'),
    }),
    handler: async (client, args) => client.createEmbeddedWalletAccount(args.walletId),
  },

  {
    name: 'embedded_wallet_account_get',
    description: 'Get account in embedded wallet',
    inputSchema: z.object({
      walletId: z.string().describe('embedded wallet ID'),
      accountId: z.string().describe('account ID within wallet'),
    }),
    handler: async (client, args) => client.getEmbeddedWalletAccount(args.walletId, args.accountId),
  },

  {
    name: 'embedded_wallet_asset_add',
    description: 'Add asset to embedded wallet account',
    inputSchema: z.object({
      walletId: z.string().describe('embedded wallet ID'),
      accountId: z.string().describe('account ID within wallet'),
      assetId: z.string().describe('asset ID to add'),
    }),
    handler: async (client, args) => client.addEmbeddedWalletAsset(args.walletId, args.accountId, args.assetId),
  },

  {
    name: 'embedded_wallet_balance_refresh',
    description: 'Refresh asset balance in embedded wallet',
    inputSchema: z.object({
      walletId: z.string().describe('embedded wallet ID'),
      accountId: z.string().describe('account ID within wallet'),
      assetId: z.string().describe('asset ID to refresh'),
    }),
    handler: async (client, args) => client.refreshEmbeddedWalletAssetBalance(args.walletId, args.accountId, args.assetId),
  },

  // =========================================================================
  // PAYMENTS (3 tools)
  // =========================================================================

  {
    name: 'payout_create',
    description: 'Create a payout instruction set',
    inputSchema: z.object({
      paymentAccount: z.string().describe('JSON: {id, type}'),
      instructionSet: z.string().describe('JSON array: payout instructions'),
    }),
    handler: async (client, args) => {
      return client.createPayoutInstructionSet({
        paymentAccount: JSON.parse(args.paymentAccount),
        instructionSet: JSON.parse(args.instructionSet),
      });
    },
  },

  {
    name: 'payout_execute',
    description: 'Execute a payout instruction set',
    inputSchema: z.object({
      payoutId: z.string().describe('payout instruction set ID'),
    }),
    handler: async (client, args) => client.executePayoutInstructionSet(args.payoutId),
  },

  {
    name: 'payout_status',
    description: 'Get payout instruction set status',
    inputSchema: z.object({
      payoutId: z.string().describe('payout instruction set ID'),
    }),
    handler: async (client, args) => client.getPayoutStatus(args.payoutId),
  },

  // =========================================================================
  // WORKSPACE (2 tools)
  // =========================================================================

  {
    name: 'workspace_freeze',
    description: 'Freeze the entire workspace',
    inputSchema: z.object({}),
    handler: async (client) => client.freezeWorkspace(),
  },

  {
    name: 'workspace_status',
    description: 'Get workspace status',
    inputSchema: z.object({}),
    handler: async (client) => client.getWorkspaceStatus(),
  },

  // =========================================================================
  // OFF EXCHANGES (5 tools)
  // =========================================================================

  {
    name: 'off_exchange_add_collateral',
    description: 'Add collateral for off-exchange',
    inputSchema: z.object({
      mainExchangeAccountId: z.string().describe('main exchange account ID'),
      collateralId: z.string().describe('collateral account ID'),
      amount: z.string().describe('collateral amount'),
      asset: z.string().describe('asset ID'),
    }),
    handler: async (client, args) => client.addCollateral(args),
  },

  {
    name: 'off_exchange_remove_collateral',
    description: 'Remove collateral from off-exchange',
    inputSchema: z.object({
      mainExchangeAccountId: z.string().describe('main exchange account ID'),
      collateralId: z.string().describe('collateral account ID'),
      amount: z.string().describe('amount to remove'),
      asset: z.string().describe('asset ID'),
    }),
    handler: async (client, args) => client.removeCollateral(args),
  },

  {
    name: 'off_exchange_create_settlement',
    description: 'Create off-exchange settlement',
    inputSchema: z.object({
      mainExchangeAccountId: z.string().describe('main exchange account ID'),
    }),
    handler: async (client, args) => client.createSettlement(args),
  },

  {
    name: 'off_exchange_settlement_txs',
    description: 'Get off-exchange settlement transactions',
    inputSchema: z.object({
      mainExchangeAccountId: z.string().describe('main exchange account ID'),
    }),
    handler: async (client, args) => client.getSettlementTransactions(args.mainExchangeAccountId),
  },

  {
    name: 'off_exchange_collateral_account',
    description: 'Get off-exchange collateral account',
    inputSchema: z.object({
      mainExchangeAccountId: z.string().describe('main exchange account ID'),
    }),
    handler: async (client, args) => client.getCollateralAccount(args.mainExchangeAccountId),
  },

  // =========================================================================
  // SMART TRANSFERS (7 tools)
  // =========================================================================

  {
    name: 'smart_transfer_create',
    description: 'Create a smart transfer ticket',
    inputSchema: z.object({
      type: z.string().describe('ticket type'),
      terms: z.string().optional().describe('JSON array: transfer terms'),
      externalRefId: z.string().optional().describe('external reference ID'),
      note: z.string().optional().describe('ticket note'),
      submit: z.boolean().optional().describe('auto-submit after creation'),
    }),
    handler: async (client, args) => {
      const { terms, ...rest } = args;
      return client.createSmartTransferTicket({
        ...rest,
        terms: terms ? JSON.parse(terms) : undefined,
      });
    },
  },

  {
    name: 'smart_transfers_list',
    description: 'List smart transfer tickets',
    inputSchema: z.object({
      q: z.string().optional().describe('search query'),
      statuses: z.string().optional().describe('filter by statuses'),
      networkId: z.string().optional().describe('filter by network ID'),
      limit: z.number().optional().describe('max results'),
      after: z.string().optional().describe('cursor for next page'),
    }),
    handler: async (client, args) => client.listSmartTransferTickets(args),
  },

  {
    name: 'smart_transfer_get',
    description: 'Get smart transfer ticket by ID',
    inputSchema: z.object({
      ticketId: z.string().describe('smart transfer ticket ID'),
    }),
    handler: async (client, args) => client.getSmartTransferTicket(args.ticketId),
  },

  {
    name: 'smart_transfer_submit',
    description: 'Submit a smart transfer ticket',
    inputSchema: z.object({
      ticketId: z.string().describe('smart transfer ticket ID'),
    }),
    handler: async (client, args) => client.submitSmartTransferTicket(args.ticketId),
  },

  {
    name: 'smart_transfer_cancel',
    description: 'Cancel a smart transfer ticket',
    inputSchema: z.object({
      ticketId: z.string().describe('smart transfer ticket ID'),
    }),
    handler: async (client, args) => client.cancelSmartTransferTicket(args.ticketId),
  },

  {
    name: 'smart_transfer_term_create',
    description: 'Create a term on a smart transfer',
    inputSchema: z.object({
      ticketId: z.string().describe('smart transfer ticket ID'),
      asset: z.string().describe('asset to transfer'),
      amount: z.string().describe('amount to transfer'),
      fromNetworkId: z.string().describe('source network ID'),
      toNetworkId: z.string().describe('destination network ID'),
    }),
    handler: async (client, args) => {
      const { ticketId, ...data } = args;
      return client.createSmartTransferTerm(ticketId, data);
    },
  },

  {
    name: 'smart_transfer_term_fund',
    description: 'Fund a smart transfer term',
    inputSchema: z.object({
      ticketId: z.string().describe('smart transfer ticket ID'),
      termId: z.string().describe('term ID to fund'),
      asset: z.string().describe('asset to fund with'),
      amount: z.string().describe('amount to fund'),
      networkConnectionId: z.string().describe('network connection ID'),
    }),
    handler: async (client, args) => {
      const { ticketId, termId, ...data } = args;
      return client.fundSmartTransferTerm(ticketId, termId, data);
    },
  },

  // =========================================================================
  // ONCHAIN DATA (6 tools)
  // =========================================================================

  {
    name: 'onchain_contract_roles',
    description: 'Get contract roles on-chain',
    inputSchema: z.object({
      contractAddress: z.string().describe('on-chain contract address'),
      blockchainId: z.string().describe('blockchain ID'),
    }),
    handler: async (client, args) => {
      const { contractAddress, ...params } = args;
      return client.getContractRoles(contractAddress, params);
    },
  },

  {
    name: 'onchain_access_registry',
    description: 'Get contract access registry state',
    inputSchema: z.object({
      contractAddress: z.string().describe('on-chain contract address'),
      blockchainId: z.string().describe('blockchain ID'),
    }),
    handler: async (client, args) => {
      const { contractAddress, ...params } = args;
      return client.getAccessRegistryState(contractAddress, params);
    },
  },

  {
    name: 'onchain_token_summary',
    description: 'Get token summary for a contract',
    inputSchema: z.object({
      contractAddress: z.string().describe('token contract address'),
      blockchainId: z.string().describe('blockchain ID'),
    }),
    handler: async (client, args) => {
      const { contractAddress, ...params } = args;
      return client.getTokenSummary(contractAddress, params);
    },
  },

  {
    name: 'onchain_total_supply_history',
    description: 'Get historical total supply data',
    inputSchema: z.object({
      contractAddress: z.string().describe('token contract address'),
      blockchainId: z.string().describe('blockchain ID'),
      startDate: z.string().optional().describe('start date (ISO 8601)'),
      endDate: z.string().optional().describe('end date (ISO 8601)'),
    }),
    handler: async (client, args) => {
      const { contractAddress, ...params } = args;
      return client.getHistoricalTotalSupply(contractAddress, params);
    },
  },

  {
    name: 'onchain_balance_history',
    description: 'Get historical balance for an account',
    inputSchema: z.object({
      contractAddress: z.string().describe('token contract address'),
      accountAddress: z.string().describe('account address to query'),
      blockchainId: z.string().describe('blockchain ID'),
      startDate: z.string().optional().describe('start date (ISO 8601)'),
      endDate: z.string().optional().describe('end date (ISO 8601)'),
    }),
    handler: async (client, args) => {
      const { contractAddress, accountAddress, ...params } = args;
      return client.getHistoricalBalance(contractAddress, accountAddress, params);
    },
  },

  {
    name: 'onchain_token_balances',
    description: 'Get latest token balances for contract',
    inputSchema: z.object({
      contractAddress: z.string().describe('token contract address'),
      blockchainId: z.string().describe('blockchain ID'),
      limit: z.number().optional().describe('max results'),
      offset: z.number().optional().describe('results offset'),
    }),
    handler: async (client, args) => {
      const { contractAddress, ...params } = args;
      return client.getLatestTokenBalances(contractAddress, params);
    },
  },
];
