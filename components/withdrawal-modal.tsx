'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Download, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

interface WithdrawalModalProps {
  availableBalance: number
  minWithdrawal?: number
}

export function WithdrawalModal({ 
  availableBalance, 
  minWithdrawal = 5000 
}: WithdrawalModalProps) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountName, setAccountName] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(num)
  }

  const validateAmount = (value: string): boolean => {
    const num = parseFloat(value)
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid amount')
      return false
    }
    if (num < minWithdrawal) {
      setError(`Minimum withdrawal amount is ${formatCurrency(minWithdrawal)}`)
      return false
    }
    if (num > availableBalance) {
      setError(`Insufficient balance. Available: ${formatCurrency(availableBalance)}`)
      return false
    }
    setError('')
    return true
  }

  const handleAmountChange = (value: string) => {
    setAmount(value)
    if (value) {
      validateAmount(value)
    } else {
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateAmount(amount)) {
      return
    }

    if (!bankAccount || !bankName || !accountName) {
      setError('Please fill in all bank details')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('You must be logged in to request a withdrawal')
        return
      }

      // Create withdrawal transaction
      const { error: insertError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          amount: parseFloat(amount),
          transaction_type: 'withdrawal',
          status: 'pending',
          description: 'Withdrawal request',
          reference: `WD_${Date.now()}_${user.id.slice(0, 8)}`,
          metadata: {
            bank_account: bankAccount,
            bank_name: bankName,
            account_name: accountName,
            notes: notes || null,
            requested_at: new Date().toISOString()
          }
        })

      if (insertError) {
        console.error('Error creating withdrawal:', insertError)
        setError('Failed to submit withdrawal request. Please try again.')
        return
      }

      // Success! Close modal and refresh
      setOpen(false)
      router.refresh()
      
      // Reset form
      setAmount('')
      setBankAccount('')
      setBankName('')
      setAccountName('')
      setNotes('')
      
      alert('Withdrawal request submitted successfully! We will process it within 1-3 business days.')
    } catch (err) {
      console.error('Error submitting withdrawal:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Download className="w-4 h-4 mr-2" />
          Request Withdrawal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
            <DialogDescription>
              Withdraw funds from your wallet to your bank account. Processing time: 1-3 business days.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Available Balance Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Available Balance: {formatCurrency(availableBalance)}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Minimum withdrawal: {formatCurrency(minWithdrawal)}
                  </p>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Withdrawal Amount (NGN)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="10000"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                min={minWithdrawal}
                max={availableBalance}
                step="100"
                required
              />
            </div>

            {/* Bank Details */}
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                placeholder="e.g., GTBank, Access Bank, UBA"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                placeholder="10-digit account number"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                maxLength={10}
                pattern="[0-9]{10}"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                placeholder="Name as it appears on your account"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                required
              />
            </div>

            {/* Optional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600"
              disabled={isSubmitting || !!error || !amount}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
