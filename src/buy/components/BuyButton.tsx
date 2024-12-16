import { useCallback, useMemo } from 'react';
import { Spinner } from '../../internal/components/Spinner';
import { checkmarkSvg } from '../../internal/svg/checkmarkSvg';
import {
  background,
  border,
  cn,
  color,
  pressable,
  text,
} from '../../styles/theme';
import { useBuyContext } from './BuyProvider';

export function BuyButton() {
  const {
    setIsDropdownOpen,
    from,
    fromETH,
    fromUSDC,
    to,
    lifecycleStatus: { statusName },
  } = useBuyContext();
  const isLoading =
    to?.loading ||
    from?.loading ||
    fromETH.loading ||
    fromUSDC.loading ||
    statusName === 'transactionPending' ||
    statusName === 'transactionApproved';

  const isDisabled = !to?.amount || !to?.token || isLoading;

  const handleSubmit = useCallback(() => {
    setIsDropdownOpen(true);
  }, [setIsDropdownOpen]);

  const buttonContent = useMemo(() => {
    if (statusName === 'success') {
      return checkmarkSvg;
    }
    return 'Buy';
  }, [statusName]);

  return (
    <button
      type="button"
      className={cn(
        background.primary,
        border.radius,
        'flex rounded-xl',
        'h-12 w-24 items-center justify-center px-4 py-3',
        isDisabled && pressable.disabled,
        text.headline,
      )}
      onClick={handleSubmit}
      data-testid="ockBuyButton_Button"
      disabled={isDisabled}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <span className={cn(text.headline, color.inverse)}>
          {buttonContent}
        </span>
      )}
    </button>
  );
}