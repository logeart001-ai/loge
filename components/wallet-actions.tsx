'use client'

import { WithdrawalModal } from '@/components/withdrawal-modal'

interface WalletActionsProps {
  availableBalance: number
}

export function WalletActions({ availableBalance }: WalletActionsProps) {
  return (
    <WithdrawalModal availableBalance={availableBalance} minWithdrawal={5000} />
  )
}
