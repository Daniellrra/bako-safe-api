import { Vault, defaultConfigurable } from 'bsafe';
import { Provider, bn, WalletUnlocked } from 'fuels';

import { accounts } from '@src/mocks/accounts';
import { networks } from '@src/mocks/networks';
import { PredicateMock } from '@src/mocks/predicate';
import { transaction } from '@src/mocks/transaction';
import { AuthValidations } from '@src/utils/testUtils/Auth';
import { sendPredicateCoins, signBypK } from '@src/utils/testUtils/Wallet';

describe('[TRANSACTION]', () => {
  let api: AuthValidations;
  beforeAll(async () => {
    api = new AuthValidations(networks['local'], accounts['USER_1']);

    await api.create();
    await api.createSession();
  });

  test(
    'Create and send a transaction to the vault FLOW',
    async () => {
      const { BSAFEVaultconfigurable } = await PredicateMock.create(1, [
        accounts['USER_1'].address,
      ]);

      const vault = await Vault.create({
        configurable: BSAFEVaultconfigurable,
        BSAFEAuth: api.authToken,
        provider: await Provider.create(defaultConfigurable['provider']),
      });

      await sendPredicateCoins(
        vault,
        bn(1_000_0),
        'ETH',
        accounts['USER_1'].privateKey,
      );
      const tx_1 = await vault.BSAFEIncludeTransaction(transaction);
      const tx_2 = await vault.BSAFEIncludeTransaction(transaction);

      await api.axios.put(`/transaction/signer/${tx_1.BSAFETransactionId}`, {
        signer: await signBypK(tx_1.getHashTxId(), accounts['USER_1'].privateKey),
        account: accounts['USER_1'].address,
        confirm: true,
      });

      const txs = await vault.BSAFEGetTransactions();

      await tx_1.wait();

      await api.axios.put(`/transaction/signer/${tx_1.BSAFETransactionId}`, {
        signer: await signBypK(tx_1.getHashTxId(), accounts['USER_1'].privateKey),
        account: accounts['USER_1'].address,
        confirm: true,
      });

      console.log(await tx_2.wait());
      console.log(JSON.stringify(txs));
    },
    30 * 1000,
  );
});
