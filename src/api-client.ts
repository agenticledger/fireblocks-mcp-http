/**
 * Fireblocks API Client
 *
 * Auth: JWT RS256 (API Key + RSA Private Key)
 * Base URLs:
 *   Production: https://api.fireblocks.io/v1
 *   Sandbox:    https://sandbox-api.fireblocks.io/v1
 * Pagination: cursor-based on some endpoints
 */

import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import crypto from 'crypto';

const BASE_URLS: Record<string, string> = {
  production: 'https://api.fireblocks.io/v1',
  sandbox: 'https://sandbox-api.fireblocks.io/v1',
};

export class FireblocksClient {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor(apiKey: string, apiSecret: string, env: string = 'sandbox') {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = BASE_URLS[env] || BASE_URLS.sandbox;
  }

  private signJwt(path: string, body?: any): string {
    // Match Fireblocks SDK: hash JSON.stringify(body || "") for bodyHash
    const bodyStr = JSON.stringify(body || '');
    const bodyHash = crypto.createHash('sha256').update(bodyStr).digest('hex');
    return jwt.sign(
      {
        uri: path,
        nonce: uuid(),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 55,
        sub: this.apiKey,
        bodyHash,
      },
      this.apiSecret,
      { algorithm: 'RS256' }
    );
  }

  private async request<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      params?: Record<string, string | number | boolean | undefined>;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, params } = options;
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // JWT signs the path (without base url, with query string)
    const pathForSigning = url.pathname + url.search;
    const token = this.signJwt(pathForSigning, body);

    const headers: Record<string, string> = {
      'X-API-Key': this.apiKey,
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    };

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (response.status === 204) return {} as T;

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Fireblocks API ${response.status}: ${text}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }
    return (await response.text()) as unknown as T;
  }

  // =========================================================================
  // VAULT ACCOUNTS
  // =========================================================================

  async listVaultAccounts(params?: {
    namePrefix?: string; nameSuffix?: string; minAmountThreshold?: number;
    assetId?: string; orderBy?: string; limit?: number; before?: string; after?: string;
  }) {
    return this.request<any>('/vault/accounts_paged', { params });
  }

  async createVaultAccount(data: { name: string; hiddenOnUI?: boolean; customerRefId?: string; autoFuel?: boolean }) {
    return this.request<any>('/vault/accounts', { method: 'POST', body: data });
  }

  async getVaultAccount(vaultAccountId: string) {
    return this.request<any>(`/vault/accounts/${encodeURIComponent(vaultAccountId)}`);
  }

  async renameVaultAccount(vaultAccountId: string, name: string) {
    return this.request<any>(`/vault/accounts/${encodeURIComponent(vaultAccountId)}`, { method: 'PUT', body: { name } });
  }

  async hideVaultAccount(vaultAccountId: string) {
    return this.request<any>(`/vault/accounts/${encodeURIComponent(vaultAccountId)}/hide`, { method: 'POST' });
  }

  async unhideVaultAccount(vaultAccountId: string) {
    return this.request<any>(`/vault/accounts/${encodeURIComponent(vaultAccountId)}/unhide`, { method: 'POST' });
  }

  async setVaultAccountCustomerRefId(vaultAccountId: string, customerRefId: string) {
    return this.request<any>(`/vault/accounts/${encodeURIComponent(vaultAccountId)}/set_customer_ref_id`, { method: 'POST', body: { customerRefId } });
  }

  async setVaultAccountAutoFuel(vaultAccountId: string, autoFuel: boolean) {
    return this.request<any>(`/vault/accounts/${encodeURIComponent(vaultAccountId)}/set_auto_fuel`, { method: 'POST', body: { autoFuel } });
  }

  async getVaultAssetWallets(params?: { totalAmountLargerThan?: number; assetId?: string; orderBy?: string; limit?: number; before?: string; after?: string }) {
    return this.request<any>('/vault/asset_wallets', { params });
  }

  async getMaxBip44IndexUsed(vaultAccountId: string) {
    return this.request<any>(`/vault/accounts/${encodeURIComponent(vaultAccountId)}/max_bip44_index_used`);
  }

  // =========================================================================
  // VAULT WALLETS & ASSETS
  // =========================================================================

  async getVaultAccountAsset(vaultAccountId: string, assetId: string) {
    return this.request<any>(`/vault/accounts/${encodeURIComponent(vaultAccountId)}/${encodeURIComponent(assetId)}`);
  }

  async createVaultWallet(vaultAccountId: string, assetId: string, eosAccountName?: string) {
    return this.request<any>(`/vault/accounts/${encodeURIComponent(vaultAccountId)}/${encodeURIComponent(assetId)}`, { method: 'POST', body: eosAccountName ? { eosAccountName } : undefined });
  }

  async activateVaultWallet(vaultAccountId: string, assetId: string) {
    return this.request<any>(`/vault/accounts/${encodeURIComponent(vaultAccountId)}/${encodeURIComponent(assetId)}/activate`, { method: 'POST' });
  }

  async refreshVaultAssetBalance(vaultAccountId: string, assetId: string) {
    return this.request<any>(`/vault/accounts/${encodeURIComponent(vaultAccountId)}/${encodeURIComponent(assetId)}/balance`, { method: 'POST' });
  }

  async getVaultAssetAddresses(vaultAccountId: string, assetId: string) {
    return this.request<any>(`/vault/accounts/${encodeURIComponent(vaultAccountId)}/${encodeURIComponent(assetId)}/addresses`);
  }

  async createDepositAddress(vaultAccountId: string, assetId: string, data?: { description?: string; customerRefId?: string }) {
    return this.request<any>(`/vault/accounts/${encodeURIComponent(vaultAccountId)}/${encodeURIComponent(assetId)}/addresses`, { method: 'POST', body: data });
  }

  async getVaultAssetAddressesPaginated(vaultAccountId: string, assetId: string, params?: { limit?: number; before?: string; after?: string }) {
    return this.request<any>(`/vault/accounts/${encodeURIComponent(vaultAccountId)}/${encodeURIComponent(assetId)}/addresses_paginated`, { params });
  }

  async getMaxSpendableAmount(vaultAccountId: string, assetId: string, params?: { manualSignig?: boolean }) {
    return this.request<any>(`/vault/accounts/${encodeURIComponent(vaultAccountId)}/${encodeURIComponent(assetId)}/max_spendable_amount`, { params });
  }

  async updateDepositAddressDescription(vaultAccountId: string, assetId: string, addressId: string, data: { description?: string; tag?: string }) {
    return this.request<any>(`/vault/accounts/${encodeURIComponent(vaultAccountId)}/${encodeURIComponent(assetId)}/addresses/${encodeURIComponent(addressId)}`, { method: 'PUT', body: data });
  }

  async getUnspentInputs(vaultAccountId: string, assetId: string) {
    return this.request<any>(`/vault/accounts/${encodeURIComponent(vaultAccountId)}/${encodeURIComponent(assetId)}/unspent_inputs`);
  }

  async getVaultBalanceByAsset(assetId: string) {
    return this.request<any>(`/vault/assets/${encodeURIComponent(assetId)}`);
  }

  async getVaultAssets(params?: { accountNamePrefix?: string; accountNameSuffix?: string }) {
    return this.request<any>('/vault/assets', { params });
  }

  async getPublicKeyInfo(params: { derivationPath: string; algorithm: string; compressed?: boolean }) {
    return this.request<any>('/vault/public_key_info', { params });
  }

  async getAssetPublicKey(vaultAccountId: string, assetId: string, change: number, addressIndex: number, params?: { compressed?: boolean }) {
    return this.request<any>(`/vault/accounts/${encodeURIComponent(vaultAccountId)}/${encodeURIComponent(assetId)}/${change}/${addressIndex}/public_key_info`, { params });
  }

  // Bulk operations
  async bulkCreateVaultAccounts(data: { vaultAccounts: Array<{ name: string; hiddenOnUI?: boolean; customerRefId?: string; autoFuel?: boolean }> }) {
    return this.request<any>('/vault/accounts/bulk', { method: 'POST', body: data });
  }

  async getBulkCreateVaultAccountsStatus(jobId: string) {
    return this.request<any>(`/vault/accounts/bulk/${encodeURIComponent(jobId)}`);
  }

  async bulkCreateDepositAddresses(data: { vaultAccountIds: string[]; asset: string }) {
    return this.request<any>('/vault/accounts/bulk/deposit_addresses', { method: 'POST', body: data });
  }

  async getBulkCreateDepositAddressesStatus(jobId: string) {
    return this.request<any>(`/vault/accounts/bulk/deposit_addresses/${encodeURIComponent(jobId)}`);
  }

  // =========================================================================
  // TRANSACTIONS
  // =========================================================================

  async listTransactions(params?: {
    before?: string; after?: string; status?: string; orderBy?: string;
    sort?: string; limit?: number; sourceType?: string; sourceId?: string;
    destType?: string; destId?: string; assets?: string; txHash?: string;
    sourceWalletId?: string; destWalletId?: string;
  }) {
    return this.request<any>('/transactions', { params });
  }

  async createTransaction(data: {
    assetId: string;
    source: { type: string; id?: string; name?: string };
    destination: { type: string; id?: string; oneTimeAddress?: { address: string; tag?: string } };
    amount: string | number;
    fee?: string | number;
    feeLevel?: string;
    note?: string;
    autoStaking?: boolean;
    operation?: string;
    customerRefId?: string;
    extraParameters?: any;
    treatAsGrossAmount?: boolean;
    forceSweep?: boolean;
  }) {
    return this.request<any>('/transactions', { method: 'POST', body: data });
  }

  async getTransaction(txId: string) {
    return this.request<any>(`/transactions/${encodeURIComponent(txId)}`);
  }

  async getTransactionByExternalId(externalTxId: string) {
    return this.request<any>(`/transactions/external_tx_id/${encodeURIComponent(externalTxId)}`);
  }

  async cancelTransaction(txId: string) {
    return this.request<any>(`/transactions/${encodeURIComponent(txId)}/cancel`, { method: 'POST' });
  }

  async freezeTransaction(txId: string) {
    return this.request<any>(`/transactions/${encodeURIComponent(txId)}/freeze`, { method: 'POST' });
  }

  async unfreezeTransaction(txId: string) {
    return this.request<any>(`/transactions/${encodeURIComponent(txId)}/unfreeze`, { method: 'POST' });
  }

  async dropTransaction(txId: string, data?: { feeLevel?: string; requestedFee?: string }) {
    return this.request<any>(`/transactions/${encodeURIComponent(txId)}/drop`, { method: 'POST', body: data });
  }

  async setTransactionConfirmationThreshold(txId: string, numOfConfirmations: number) {
    return this.request<any>(`/transactions/${encodeURIComponent(txId)}/set_confirmation_threshold`, { method: 'POST', body: { numOfConfirmations } });
  }

  async setConfirmationThresholdByTxHash(txHash: string, numOfConfirmations: number) {
    return this.request<any>(`/txHash/${encodeURIComponent(txHash)}/set_confirmation_threshold`, { method: 'POST', body: { numOfConfirmations } });
  }

  async estimateTransactionFee(data: {
    assetId: string;
    amount: string | number;
    source: { type: string; id?: string };
    destination: { type: string; id?: string; oneTimeAddress?: { address: string } };
    operation?: string;
  }) {
    return this.request<any>('/transactions/estimate_fee', { method: 'POST', body: data });
  }

  async estimateNetworkFee(assetId: string) {
    return this.request<any>('/estimate_network_fee', { params: { assetId } });
  }

  async validateAddress(assetId: string, address: string) {
    return this.request<any>(`/transactions/validate_address/${encodeURIComponent(assetId)}/${encodeURIComponent(address)}`);
  }

  // =========================================================================
  // BLOCKCHAINS & ASSETS
  // =========================================================================

  async listSupportedAssets() {
    return this.request<any>('/supported_assets');
  }

  async registerAsset(data: { blockchainId: string; address?: string; symbol?: string }) {
    return this.request<any>('/assets', { method: 'POST', body: data });
  }

  async getAsset(assetId: string) {
    return this.request<any>(`/assets/${encodeURIComponent(assetId)}`);
  }

  async updateAssetMetadata(assetId: string, data: { alias?: string; issuerName?: string }) {
    return this.request<any>(`/assets/${encodeURIComponent(assetId)}`, { method: 'PATCH', body: data });
  }

  async setAssetPrice(assetId: string, data: { currency: string; price: number }) {
    return this.request<any>(`/assets/prices/${encodeURIComponent(assetId)}`, { method: 'POST', body: data });
  }

  async listBlockchains() {
    return this.request<any>('/blockchains');
  }

  async getBlockchain(blockchainId: string) {
    return this.request<any>(`/blockchains/${encodeURIComponent(blockchainId)}`);
  }

  // =========================================================================
  // EXCHANGE ACCOUNTS
  // =========================================================================

  async listExchangeAccounts() {
    return this.request<any>('/exchange_accounts');
  }

  async getExchangeAccount(exchangeAccountId: string) {
    return this.request<any>(`/exchange_accounts/${encodeURIComponent(exchangeAccountId)}`);
  }

  async getExchangeAccountAsset(exchangeAccountId: string, assetId: string) {
    return this.request<any>(`/exchange_accounts/${encodeURIComponent(exchangeAccountId)}/${encodeURIComponent(assetId)}`);
  }

  async internalTransfer(exchangeAccountId: string, data: { asset: string; amount: string; sourceType: string; destType: string }) {
    return this.request<any>(`/exchange_accounts/${encodeURIComponent(exchangeAccountId)}/internal_transfer`, { method: 'POST', body: data });
  }

  async convertExchangeFunds(exchangeAccountId: string, data: { srcAsset: string; destAsset: string; amount: number }) {
    return this.request<any>(`/exchange_accounts/${encodeURIComponent(exchangeAccountId)}/convert`, { method: 'POST', body: data });
  }

  // =========================================================================
  // FIAT ACCOUNTS
  // =========================================================================

  async listFiatAccounts() {
    return this.request<any>('/fiat_accounts');
  }

  async getFiatAccount(accountId: string) {
    return this.request<any>(`/fiat_accounts/${encodeURIComponent(accountId)}`);
  }

  async redeemFundsToLinkedDDA(accountId: string, data: { amount: number; asset?: string }) {
    return this.request<any>(`/fiat_accounts/${encodeURIComponent(accountId)}/redeem_to_linked_dda`, { method: 'POST', body: data });
  }

  async depositFundsFromLinkedDDA(accountId: string, data: { amount: number; asset?: string }) {
    return this.request<any>(`/fiat_accounts/${encodeURIComponent(accountId)}/deposit_from_linked_dda`, { method: 'POST', body: data });
  }

  // =========================================================================
  // INTERNAL WALLETS
  // =========================================================================

  async listInternalWallets() {
    return this.request<any>('/internal_wallets');
  }

  async createInternalWallet(data: { name: string; customerRefId?: string }) {
    return this.request<any>('/internal_wallets', { method: 'POST', body: data });
  }

  async getInternalWallet(walletId: string) {
    return this.request<any>(`/internal_wallets/${encodeURIComponent(walletId)}`);
  }

  async deleteInternalWallet(walletId: string) {
    return this.request<any>(`/internal_wallets/${encodeURIComponent(walletId)}`, { method: 'DELETE' });
  }

  async getInternalWalletAsset(walletId: string, assetId: string) {
    return this.request<any>(`/internal_wallets/${encodeURIComponent(walletId)}/${encodeURIComponent(assetId)}`);
  }

  async addInternalWalletAsset(walletId: string, assetId: string, data: { address: string; tag?: string }) {
    return this.request<any>(`/internal_wallets/${encodeURIComponent(walletId)}/${encodeURIComponent(assetId)}`, { method: 'POST', body: data });
  }

  async deleteInternalWalletAsset(walletId: string, assetId: string) {
    return this.request<any>(`/internal_wallets/${encodeURIComponent(walletId)}/${encodeURIComponent(assetId)}`, { method: 'DELETE' });
  }

  // =========================================================================
  // EXTERNAL WALLETS
  // =========================================================================

  async listExternalWallets() {
    return this.request<any>('/external_wallets');
  }

  async createExternalWallet(data: { name: string; customerRefId?: string }) {
    return this.request<any>('/external_wallets', { method: 'POST', body: data });
  }

  async getExternalWallet(walletId: string) {
    return this.request<any>(`/external_wallets/${encodeURIComponent(walletId)}`);
  }

  async deleteExternalWallet(walletId: string) {
    return this.request<any>(`/external_wallets/${encodeURIComponent(walletId)}`, { method: 'DELETE' });
  }

  async getExternalWalletAsset(walletId: string, assetId: string) {
    return this.request<any>(`/external_wallets/${encodeURIComponent(walletId)}/${encodeURIComponent(assetId)}`);
  }

  async addExternalWalletAsset(walletId: string, assetId: string, data: { address: string; tag?: string }) {
    return this.request<any>(`/external_wallets/${encodeURIComponent(walletId)}/${encodeURIComponent(assetId)}`, { method: 'POST', body: data });
  }

  async deleteExternalWalletAsset(walletId: string, assetId: string) {
    return this.request<any>(`/external_wallets/${encodeURIComponent(walletId)}/${encodeURIComponent(assetId)}`, { method: 'DELETE' });
  }

  // =========================================================================
  // STAKING
  // =========================================================================

  async listStakingChains() {
    return this.request<any>('/staking/chains');
  }

  async getStakingChainInfo(chainDescriptor: string) {
    return this.request<any>(`/staking/chains/${encodeURIComponent(chainDescriptor)}/chainInfo`);
  }

  async stake(data: { vaultAccountId: string; providerId: string; stakeAmount: string; txNote?: string; feeLevel?: string }) {
    return this.request<any>('/staking/stake', { method: 'POST', body: data });
  }

  async unstake(data: { id: string; txNote?: string; feeLevel?: string }) {
    return this.request<any>('/staking/unstake', { method: 'POST', body: data });
  }

  async withdrawStaking(data: { id: string; txNote?: string; feeLevel?: string }) {
    return this.request<any>('/staking/withdraw', { method: 'POST', body: data });
  }

  async claimStakingRewards(data: { id: string; txNote?: string; feeLevel?: string }) {
    return this.request<any>('/staking/claimRewards', { method: 'POST', body: data });
  }

  async listStakingPositions() {
    return this.request<any>('/staking/positions');
  }

  async getStakingPositionsSummary() {
    return this.request<any>('/staking/positions/summary');
  }

  async getStakingPositionsSummaryByVault() {
    return this.request<any>('/staking/positions/summary/vaults');
  }

  async getStakingPosition(positionId: string) {
    return this.request<any>(`/staking/positions/${encodeURIComponent(positionId)}`);
  }

  async listStakingProviders() {
    return this.request<any>('/staking/providers');
  }

  async approveStakingProviderTerms(data: { providerId: string }) {
    return this.request<any>('/staking/providers/approveTermsOfService', { method: 'POST', body: data });
  }

  // =========================================================================
  // GAS STATIONS
  // =========================================================================

  async getGasStationSettings() {
    return this.request<any>('/gas_station');
  }

  async getGasStationSettingsByAsset(assetId: string) {
    return this.request<any>(`/gas_station/${encodeURIComponent(assetId)}`);
  }

  async updateGasStationSettings(data: { gasThreshold: string; gasCap: string; maxGasPrice?: string }) {
    return this.request<any>('/gas_station/configuration', { method: 'PUT', body: data });
  }

  async updateGasStationSettingsByAsset(assetId: string, data: { gasThreshold: string; gasCap: string; maxGasPrice?: string }) {
    return this.request<any>(`/gas_station/configuration/${encodeURIComponent(assetId)}`, { method: 'PUT', body: data });
  }

  // =========================================================================
  // NETWORK CONNECTIONS
  // =========================================================================

  async listNetworkConnections() {
    return this.request<any>('/network_connections');
  }

  async createNetworkConnection(data: { localNetworkId: string; remoteNetworkId: string; routingPolicy?: any }) {
    return this.request<any>('/network_connections', { method: 'POST', body: data });
  }

  async getNetworkConnection(connectionId: string) {
    return this.request<any>(`/network_connections/${encodeURIComponent(connectionId)}`);
  }

  async deleteNetworkConnection(connectionId: string) {
    return this.request<any>(`/network_connections/${encodeURIComponent(connectionId)}`, { method: 'DELETE' });
  }

  async listNetworkIds() {
    return this.request<any>('/network_ids');
  }

  async createNetworkId(data: { name: string; routingPolicy?: any }) {
    return this.request<any>('/network_ids', { method: 'POST', body: data });
  }

  async getNetworkId(networkId: string) {
    return this.request<any>(`/network_ids/${encodeURIComponent(networkId)}`);
  }

  async deleteNetworkId(networkId: string) {
    return this.request<any>(`/network_ids/${encodeURIComponent(networkId)}`, { method: 'DELETE' });
  }

  // =========================================================================
  // CONTRACTS (WHITELISTED)
  // =========================================================================

  async listWhitelistedContracts() {
    return this.request<any>('/contracts');
  }

  async addWhitelistedContract(data: { name: string; assets?: Array<{ id: string; address: string; tag?: string }> }) {
    return this.request<any>('/contracts', { method: 'POST', body: data });
  }

  async getWhitelistedContract(contractId: string) {
    return this.request<any>(`/contracts/${encodeURIComponent(contractId)}`);
  }

  async deleteWhitelistedContract(contractId: string) {
    return this.request<any>(`/contracts/${encodeURIComponent(contractId)}`, { method: 'DELETE' });
  }

  async addWhitelistedContractAsset(contractId: string, assetId: string, data: { address: string; tag?: string }) {
    return this.request<any>(`/contracts/${encodeURIComponent(contractId)}/${encodeURIComponent(assetId)}`, { method: 'POST', body: data });
  }

  async deleteWhitelistedContractAsset(contractId: string, assetId: string) {
    return this.request<any>(`/contracts/${encodeURIComponent(contractId)}/${encodeURIComponent(assetId)}`, { method: 'DELETE' });
  }

  // =========================================================================
  // SMART CONTRACTS (DEPLOYED)
  // =========================================================================

  async listDeployedContracts() {
    return this.request<any>('/tokenization/contracts');
  }

  async getDeployedContract(contractId: string) {
    return this.request<any>(`/tokenization/contracts/${encodeURIComponent(contractId)}`);
  }

  async fetchContractAbi(data: { contractAddress: string; blockchainId: string }) {
    return this.request<any>('/contract_interactions/base_asset_id/abi', { method: 'POST', body: data });
  }

  // =========================================================================
  // CONTRACT INTERACTIONS
  // =========================================================================

  async readContractFunction(data: {
    contractAddress: string; abiFunction: any; blockchainId: string;
    vaultAccountId?: string; amount?: string; feeLevel?: string;
  }) {
    return this.request<any>('/contract_interactions/base_asset_id/read', { method: 'POST', body: data });
  }

  async writeContractFunction(data: {
    contractAddress: string; abiFunction: any; blockchainId: string;
    vaultAccountId: string; amount?: string; feeLevel?: string; note?: string;
  }) {
    return this.request<any>('/contract_interactions/base_asset_id/write', { method: 'POST', body: data });
  }

  // =========================================================================
  // TOKENIZATION
  // =========================================================================

  async issueToken(data: { blockchainId: string; vaultAccountId: string; contractId?: string; name?: string; symbol?: string }) {
    return this.request<any>('/tokenization/tokens', { method: 'POST', body: data });
  }

  async listLinkedTokens(params?: { limit?: number; offset?: number; status?: string }) {
    return this.request<any>('/tokenization/tokens', { params });
  }

  async getLinkedToken(tokenId: string) {
    return this.request<any>(`/tokenization/tokens/${encodeURIComponent(tokenId)}`);
  }

  async unlinkToken(tokenId: string) {
    return this.request<any>(`/tokenization/tokens/${encodeURIComponent(tokenId)}`, { method: 'DELETE' });
  }

  async linkContract(data: { contractId: string; assetId: string }) {
    return this.request<any>('/tokenization/tokens/link', { method: 'POST', body: data });
  }

  async listCollections(params?: { limit?: number; offset?: number }) {
    return this.request<any>('/tokenization/collections', { params });
  }

  async getCollection(collectionId: string) {
    return this.request<any>(`/tokenization/collections/${encodeURIComponent(collectionId)}`);
  }

  async mintTokens(data: { contractId: string; amount: string; vaultAccountId: string; destinationAddress?: string }) {
    return this.request<any>('/tokenization/tokens/mint', { method: 'POST', body: data });
  }

  async burnTokens(data: { contractId: string; amount: string; vaultAccountId: string }) {
    return this.request<any>('/tokenization/tokens/burn', { method: 'POST', body: data });
  }

  // =========================================================================
  // NFTs
  // =========================================================================

  async listOwnedNfts(params?: { vaultAccountIds?: string; blockchainDescriptor?: string; limit?: number; offset?: number; sort?: string; order?: string }) {
    return this.request<any>('/nfts/ownership/tokens', { params });
  }

  async listOwnedCollections(params?: { limit?: number; offset?: number; search?: string }) {
    return this.request<any>('/nfts/ownership/collections', { params });
  }

  async getNftById(id: string) {
    return this.request<any>(`/nfts/tokens/${encodeURIComponent(id)}`);
  }

  async getNftsByIds(ids: string[]) {
    return this.request<any>('/nfts/tokens', { params: { ids: ids.join(',') } });
  }

  async refreshNftMetadata(id: string) {
    return this.request<any>(`/nfts/tokens/${encodeURIComponent(id)}`, { method: 'PUT' });
  }

  async refreshVaultAccountNfts(vaultAccountId: string, data: { blockchainDescriptor: string; assetId?: string }) {
    return this.request<any>(`/nfts/ownership/tokens/refresh/${encodeURIComponent(vaultAccountId)}`, { method: 'PUT', body: data });
  }

  // =========================================================================
  // WEBHOOKS V2
  // =========================================================================

  async createWebhook(data: { url: string; events?: string[]; description?: string }) {
    return this.request<any>('/webhooks', { method: 'POST', body: data });
  }

  async listWebhooks(params?: { limit?: number; cursor?: string; order?: string }) {
    return this.request<any>('/webhooks', { params });
  }

  async getWebhook(webhookId: string) {
    return this.request<any>(`/webhooks/${encodeURIComponent(webhookId)}`);
  }

  async updateWebhook(webhookId: string, data: { url?: string; events?: string[]; description?: string; status?: string }) {
    return this.request<any>(`/webhooks/${encodeURIComponent(webhookId)}`, { method: 'PATCH', body: data });
  }

  async deleteWebhook(webhookId: string) {
    return this.request<any>(`/webhooks/${encodeURIComponent(webhookId)}`, { method: 'DELETE' });
  }

  async resendWebhookNotification(webhookId: string, notificationId: string) {
    return this.request<any>(`/webhooks/${encodeURIComponent(webhookId)}/notifications/${encodeURIComponent(notificationId)}/resend`, { method: 'POST' });
  }

  // Webhooks V1
  async resendFailedWebhooks() {
    return this.request<any>('/webhooks/resend', { method: 'POST' });
  }

  async resendWebhooksForTransaction(txId: string, data: { resendCreated?: boolean; resendStatusUpdated?: boolean }) {
    return this.request<any>(`/webhooks/resend/${encodeURIComponent(txId)}`, { method: 'POST', body: data });
  }

  // =========================================================================
  // POLICY EDITOR
  // =========================================================================

  async getActivePolicy() {
    return this.request<any>('/tap/active_policy');
  }

  async getActiveDraft() {
    return this.request<any>('/tap/draft');
  }

  async updateDraft(data: { rules: any[] }) {
    return this.request<any>('/tap/draft', { method: 'PUT', body: data });
  }

  async publishDraft() {
    return this.request<any>('/tap/draft/publish', { method: 'POST' });
  }

  async publishPolicyRules(data: { rules: any[] }) {
    return this.request<any>('/tap/publish', { method: 'POST', body: data });
  }

  // =========================================================================
  // USERS & AUDIT
  // =========================================================================

  async listUsers() {
    return this.request<any>('/users');
  }

  async getAuditLogs(params?: { timePeriod?: string; cursor?: string; limit?: number }) {
    return this.request<any>('/audits', { params });
  }

  // =========================================================================
  // WEB3 CONNECTIONS
  // =========================================================================

  async listWeb3Connections(params?: { limit?: number; offset?: number; sort?: string; filter?: string }) {
    return this.request<any>('/connections/wc', { params });
  }

  async createWeb3Connection(data: { vaultAccountId: number; uri: string; chainIds?: string[]; feeLevel?: string }) {
    return this.request<any>('/connections/wc', { method: 'POST', body: data });
  }

  async respondToWeb3ConnectionRequest(connectionId: string, data: { approve: boolean }) {
    return this.request<any>(`/connections/wc/${encodeURIComponent(connectionId)}`, { method: 'PUT', body: data });
  }

  async removeWeb3Connection(connectionId: string) {
    return this.request<any>(`/connections/wc/${encodeURIComponent(connectionId)}`, { method: 'DELETE' });
  }

  // =========================================================================
  // COMPLIANCE & TRAVEL RULE
  // =========================================================================

  async getComplianceScreeningPolicy() {
    return this.request<any>('/screening/travel_rule/policy');
  }

  async getAmlScreeningPolicy() {
    return this.request<any>('/screening/aml/policy');
  }

  async updateTravelRuleConfig(data: any) {
    return this.request<any>('/screening/travel_rule/policy', { method: 'PUT', body: data });
  }

  async updateAmlConfig(data: any) {
    return this.request<any>('/screening/aml/policy', { method: 'PUT', body: data });
  }

  async getComplianceDetailsForTransaction(txId: string) {
    return this.request<any>(`/screening/transaction/${encodeURIComponent(txId)}`);
  }

  async validateTravelRuleTransaction(data: any) {
    return this.request<any>('/screening/travel_rule/transaction/validate', { method: 'POST', body: data });
  }

  async validateFullTravelRuleTransaction(data: any) {
    return this.request<any>('/screening/travel_rule/transaction/validate/full', { method: 'POST', body: data });
  }

  async listVasps() {
    return this.request<any>('/screening/travel_rule/vasp');
  }

  async getVasp(vaspDid: string) {
    return this.request<any>(`/screening/travel_rule/vasp/${encodeURIComponent(vaspDid)}`);
  }

  // =========================================================================
  // EMBEDDED WALLETS (NCW)
  // =========================================================================

  async listEmbeddedWallets(params?: { limit?: number; offset?: number }) {
    return this.request<any>('/ncw/wallets', { params });
  }

  async createEmbeddedWallet(data?: { customerRefId?: string }) {
    return this.request<any>('/ncw/wallets', { method: 'POST', body: data });
  }

  async getEmbeddedWallet(walletId: string) {
    return this.request<any>(`/ncw/wallets/${encodeURIComponent(walletId)}`);
  }

  async listEmbeddedWalletAssets(walletId: string, accountId: string, params?: { limit?: number; offset?: number }) {
    return this.request<any>(`/ncw/wallets/${encodeURIComponent(walletId)}/accounts/${encodeURIComponent(accountId)}/assets`, { params });
  }

  async getEmbeddedWalletAssetBalance(walletId: string, accountId: string, assetId: string) {
    return this.request<any>(`/ncw/wallets/${encodeURIComponent(walletId)}/accounts/${encodeURIComponent(accountId)}/assets/${encodeURIComponent(assetId)}/balance`);
  }

  async createEmbeddedWalletAccount(walletId: string) {
    return this.request<any>(`/ncw/wallets/${encodeURIComponent(walletId)}/accounts`, { method: 'POST' });
  }

  async getEmbeddedWalletAccount(walletId: string, accountId: string) {
    return this.request<any>(`/ncw/wallets/${encodeURIComponent(walletId)}/accounts/${encodeURIComponent(accountId)}`);
  }

  async addEmbeddedWalletAsset(walletId: string, accountId: string, assetId: string) {
    return this.request<any>(`/ncw/wallets/${encodeURIComponent(walletId)}/accounts/${encodeURIComponent(accountId)}/assets/${encodeURIComponent(assetId)}`, { method: 'POST' });
  }

  async refreshEmbeddedWalletAssetBalance(walletId: string, accountId: string, assetId: string) {
    return this.request<any>(`/ncw/wallets/${encodeURIComponent(walletId)}/accounts/${encodeURIComponent(accountId)}/assets/${encodeURIComponent(assetId)}/balance`, { method: 'PUT' });
  }

  // =========================================================================
  // PAYMENTS
  // =========================================================================

  async createPayoutInstructionSet(data: { paymentAccount: { id: string; type: string }; instructionSet: any[] }) {
    return this.request<any>('/payments/payout', { method: 'POST', body: data });
  }

  async executePayoutInstructionSet(payoutId: string) {
    return this.request<any>(`/payments/payout/${encodeURIComponent(payoutId)}/actions/execute`, { method: 'POST' });
  }

  async getPayoutStatus(payoutId: string) {
    return this.request<any>(`/payments/payout/${encodeURIComponent(payoutId)}`);
  }

  // =========================================================================
  // WORKSPACE
  // =========================================================================

  async freezeWorkspace() {
    return this.request<any>('/workspace/freeze', { method: 'POST' });
  }

  async getWorkspaceStatus() {
    return this.request<any>('/workspace/status');
  }

  // =========================================================================
  // OFF EXCHANGES
  // =========================================================================

  async addCollateral(data: { mainExchangeAccountId: string; collateralId: string; amount: string; asset: string }) {
    return this.request<any>('/off_exchange/add', { method: 'POST', body: data });
  }

  async removeCollateral(data: { mainExchangeAccountId: string; collateralId: string; amount: string; asset: string }) {
    return this.request<any>('/off_exchange/remove', { method: 'POST', body: data });
  }

  async createSettlement(data: { mainExchangeAccountId: string }) {
    return this.request<any>('/off_exchange/settlements/trader', { method: 'POST', body: data });
  }

  async getSettlementTransactions(mainExchangeAccountId: string) {
    return this.request<any>(`/off_exchange/settlements/transactions?mainExchangeAccountId=${encodeURIComponent(mainExchangeAccountId)}`);
  }

  async getCollateralAccount(mainExchangeAccountId: string) {
    return this.request<any>(`/off_exchange/collateral_accounts/${encodeURIComponent(mainExchangeAccountId)}`);
  }

  // =========================================================================
  // SMART TRANSFERS
  // =========================================================================

  async createSmartTransferTicket(data: { type: string; terms?: any[]; externalRefId?: string; note?: string; submit?: boolean }) {
    return this.request<any>('/smart-transfers', { method: 'POST', body: data });
  }

  async listSmartTransferTickets(params?: { q?: string; statuses?: string; networkId?: string; limit?: number; after?: string }) {
    return this.request<any>('/smart-transfers', { params });
  }

  async getSmartTransferTicket(ticketId: string) {
    return this.request<any>(`/smart-transfers/${encodeURIComponent(ticketId)}`);
  }

  async submitSmartTransferTicket(ticketId: string) {
    return this.request<any>(`/smart-transfers/${encodeURIComponent(ticketId)}/submit`, { method: 'PUT' });
  }

  async cancelSmartTransferTicket(ticketId: string) {
    return this.request<any>(`/smart-transfers/${encodeURIComponent(ticketId)}/cancel`, { method: 'PUT' });
  }

  async createSmartTransferTerm(ticketId: string, data: { asset: string; amount: string; fromNetworkId: string; toNetworkId: string }) {
    return this.request<any>(`/smart-transfers/${encodeURIComponent(ticketId)}/terms`, { method: 'POST', body: data });
  }

  async fundSmartTransferTerm(ticketId: string, termId: string, data: { asset: string; amount: string; networkConnectionId: string }) {
    return this.request<any>(`/smart-transfers/${encodeURIComponent(ticketId)}/terms/${encodeURIComponent(termId)}/fund`, { method: 'PUT', body: data });
  }

  // =========================================================================
  // ONCHAIN DATA
  // =========================================================================

  async getContractRoles(contractAddress: string, params: { blockchainId: string }) {
    return this.request<any>(`/onchain/contracts/${encodeURIComponent(contractAddress)}/roles`, { params });
  }

  async getAccessRegistryState(contractAddress: string, params: { blockchainId: string }) {
    return this.request<any>(`/onchain/contracts/${encodeURIComponent(contractAddress)}/access-registry`, { params });
  }

  async getTokenSummary(contractAddress: string, params: { blockchainId: string }) {
    return this.request<any>(`/onchain/tokens/${encodeURIComponent(contractAddress)}/summary`, { params });
  }

  async getHistoricalTotalSupply(contractAddress: string, params: { blockchainId: string; startDate?: string; endDate?: string }) {
    return this.request<any>(`/onchain/tokens/${encodeURIComponent(contractAddress)}/total-supply/history`, { params });
  }

  async getHistoricalBalance(contractAddress: string, accountAddress: string, params: { blockchainId: string; startDate?: string; endDate?: string }) {
    return this.request<any>(`/onchain/tokens/${encodeURIComponent(contractAddress)}/balances/${encodeURIComponent(accountAddress)}/history`, { params });
  }

  async getLatestTokenBalances(contractAddress: string, params: { blockchainId: string; limit?: number; offset?: number }) {
    return this.request<any>(`/onchain/tokens/${encodeURIComponent(contractAddress)}/balances`, { params });
  }
}
