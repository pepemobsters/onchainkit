import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { http, createConfig } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { mainnet, sepolia } from 'wagmi/chains';
import { mock } from 'wagmi/connectors';
import { Capabilities } from '../../constants';
import type { Call } from '../../transaction/types';
import { executeSwapTransactions } from './executeSwapTransactions';

vi.mock('wagmi/actions', () => ({
  waitForTransactionReceipt: vi.fn().mockResolvedValue({
    transactionHash: 'receiptHash',
  }),
}));

describe('executeSwapTransactions', () => {
  const updateLifecycleStatus = vi.fn();
  let sendTransactionAsync: Mock;
  let sendCallsAsync: Mock;
  let setCallsId: Mock;
  const mockTransactionReceipt = {
    transactionHash: 'receiptHash',
  };

  const config = createConfig({
    chains: [mainnet, sepolia],
    connectors: [
      mock({
        accounts: [
          '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
          '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        ],
      }),
    ],
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();

    sendTransactionAsync = vi
      .fn()
      .mockResolvedValueOnce('txHash1')
      .mockResolvedValueOnce('txHash2')
      .mockResolvedValueOnce('txHash3');

    sendCallsAsync = vi.fn().mockResolvedValue('callsId');
    setCallsId = vi.fn();
  });

  it('should execute atomic batch transactions when supported', async () => {
    const transactions: Call[] = [
      { to: '0x123', value: 0n, data: '0x' },
      { to: '0x456', value: 0n, data: '0x' },
    ];

    await executeSwapTransactions({
      config,
      sendTransactionAsync,
      sendCallsAsync,
      setCallsId,
      updateLifecycleStatus,
      walletCapabilities: { [Capabilities.AtomicBatch]: { supported: true } },
      transactions,
    });

    expect(sendCallsAsync).toHaveBeenCalledTimes(1);
    expect(sendCallsAsync).toHaveBeenCalledWith({ calls: transactions });
    expect(setCallsId).toHaveBeenCalledWith('callsId');
    expect(updateLifecycleStatus).toHaveBeenCalledTimes(1);
    expect(updateLifecycleStatus).toHaveBeenCalledWith({
      statusName: 'transactionPending',
    });
  });

  it('should execute non-batched transactions sequentially', async () => {
    const transactions: Call[] = [
      { to: '0x123', value: 0n, data: '0x' },
      { to: '0x456', value: 0n, data: '0x' },
    ];

    await executeSwapTransactions({
      config,
      sendTransactionAsync,
      sendCallsAsync,
      setCallsId,
      updateLifecycleStatus,
      walletCapabilities: { [Capabilities.AtomicBatch]: { supported: false } },
      transactions,
    });

    expect(sendTransactionAsync).toHaveBeenCalledTimes(2);
    expect(waitForTransactionReceipt).toHaveBeenCalledTimes(2);
    expect(updateLifecycleStatus).toHaveBeenCalledTimes(4);
    expect(updateLifecycleStatus).toHaveBeenNthCalledWith(1, {
      statusName: 'transactionPending',
    });
    expect(updateLifecycleStatus).toHaveBeenNthCalledWith(2, {
      statusName: 'transactionApproved',
      statusData: {
        transactionHash: 'txHash1',
        transactionType: 'ERC20',
      },
    });
    expect(updateLifecycleStatus).toHaveBeenNthCalledWith(3, {
      statusName: 'transactionPending',
    });
    expect(updateLifecycleStatus).toHaveBeenNthCalledWith(4, {
      statusName: 'success',
      statusData: {
        transactionReceipt: mockTransactionReceipt,
      },
    });
  });

  it('should handle Permit2 approval process', async () => {
    const transactions: Call[] = [
      { to: '0x123', value: 0n, data: '0x' },
      { to: '0x456', value: 0n, data: '0x' },
      { to: '0x789', value: 0n, data: '0x' },
    ];

    await executeSwapTransactions({
      config,
      sendTransactionAsync,
      sendCallsAsync,
      setCallsId,
      updateLifecycleStatus,
      walletCapabilities: { [Capabilities.AtomicBatch]: { supported: false } },
      transactions,
    });

    expect(sendTransactionAsync).toHaveBeenCalledTimes(3);
    expect(waitForTransactionReceipt).toHaveBeenCalledTimes(3);
    expect(updateLifecycleStatus).toHaveBeenCalledTimes(6);
    expect(updateLifecycleStatus).toHaveBeenNthCalledWith(2, {
      statusName: 'transactionApproved',
      statusData: {
        transactionHash: 'txHash1',
        transactionType: 'Permit2',
      },
    });
    expect(updateLifecycleStatus).toHaveBeenNthCalledWith(4, {
      statusName: 'transactionApproved',
      statusData: {
        transactionHash: 'txHash2',
        transactionType: 'ERC20',
      },
    });
    expect(updateLifecycleStatus).toHaveBeenNthCalledWith(6, {
      statusName: 'success',
      statusData: {
        transactionReceipt: mockTransactionReceipt,
      },
    });
  });
});