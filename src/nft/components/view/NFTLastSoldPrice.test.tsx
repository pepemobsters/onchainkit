import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import {
  type Mock,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { useNFTContext } from '../NFTProvider';
import { NFTLastSoldPrice } from './NFTLastSoldPrice';

vi.mock('../NFTProvider', () => ({
  useNFTContext: vi.fn(),
}));

describe('NFTLastSoldPrice', () => {
  beforeEach(() => {
    (useNFTContext as Mock).mockReturnValue({
      lastSoldPrice: {
        amount: '1',
        currency: 'ETH',
        amountUSD: '3000',
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render', () => {
    const { getByText } = render(<NFTLastSoldPrice />);
    expect(getByText('Mint price')).toBeInTheDocument();
    expect(getByText('1 ETH')).toBeInTheDocument();
    expect(getByText('$3,000.00')).toBeInTheDocument();
  });

  it('should render null if price is not available', () => {
    (useNFTContext as Mock).mockReturnValue({
      lastSoldPrice: {
        amount: null,
        currency: 'ETH',
      },
    });
    const { container } = render(<NFTLastSoldPrice />);
    expect(container.firstChild).toBeNull();
  });

  it('should render null if currency is not available', () => {
    (useNFTContext as Mock).mockReturnValue({
      lastSoldPrice: { amount: '100', currency: null, amountUSD: '3000' },
    });
    const { container } = render(<NFTLastSoldPrice />);
    expect(container.firstChild).toBeNull();
  });

  it('should apply custom className', () => {
    const { getByText } = render(<NFTLastSoldPrice className="custom-class" />);
    expect(getByText('Mint price').parentElement).toHaveClass('custom-class');
  });

  it('should display custom label', () => {
    const { getByText } = render(<NFTLastSoldPrice label="Last Sold Price" />);
    expect(getByText('Last Sold Price')).toBeInTheDocument();
  });
});