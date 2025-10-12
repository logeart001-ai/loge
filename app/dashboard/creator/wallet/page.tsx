import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WalletActions } from '@/components/wallet-actions'
import { 
  Wallet, 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  CreditCard
} from 'lucide-react'
import Link from 'next/link'

interface WalletTransaction {
  id: string
  amount: number | string
  transaction_type: 'credit' | 'debit' | 'withdrawal' | 'refund'
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  description: string | null
  reference: string | null
  created_at: string
  metadata?: Record<string, unknown>
}

interface WalletBalance {
  balance: number | string
  total_transactions: number
  total_credits: number | string
  total_debits: number | string
  last_transaction_date: string | null
}

async function getWalletData(userId: string) {
  const supabase = await createServerClient()
  
  // Get wallet balance
  const { data: balanceData, error: balanceError } = await supabase
    .from('wallet_balances')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (balanceError && balanceError.code !== 'PGRST116') {
    console.error('Error fetching wallet balance:', balanceError)
  }

  // Get recent transactions
  const { data: transactions, error: transError } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (transError) {
    console.error('Error fetching transactions:', transError)
  }

  return {
    balance: (balanceData as WalletBalance | null) || {
      balance: 0,
      total_transactions: 0,
      total_credits: 0,
      total_debits: 0,
      last_transaction_date: null
    },
    transactions: (transactions as WalletTransaction[]) || []
  }
}

function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(num)
}

function getTransactionIcon(type: string) {
  switch (type) {
    case 'credit':
    case 'refund':
      return <TrendingUp className="w-4 h-4 text-green-600" />
    case 'debit':
    case 'withdrawal':
      return <TrendingDown className="w-4 h-4 text-red-600" />
    default:
      return <DollarSign className="w-4 h-4 text-gray-600" />
  }
}

function getStatusBadge(status: string) {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
    completed: { variant: 'default', label: 'Completed' },
    pending: { variant: 'secondary', label: 'Pending' },
    failed: { variant: 'destructive', label: 'Failed' },
    cancelled: { variant: 'outline', label: 'Cancelled' }
  }
  
  const config = variants[status] || variants.completed
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export default async function WalletPage() {
  const user = await requireAuth()
  
  // Check if user is a creator
  if (user.user_metadata?.user_type !== 'creator') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Creator Access Only</h2>
            <p className="text-gray-600 mb-4">
              The wallet feature is only available for creators. Switch to a creator account to access your earnings.
            </p>
            <Link href="/dashboard/collector">
              <Button>Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { balance, transactions } = await getWalletData(user.id)
  
  const currentBalance = typeof balance.balance === 'string' 
    ? parseFloat(balance.balance) 
    : balance.balance

  const totalCredits = typeof balance.total_credits === 'string'
    ? parseFloat(balance.total_credits)
    : (balance.total_credits || 0)

  const totalDebits = typeof balance.total_debits === 'string'
    ? parseFloat(balance.total_debits)
    : (balance.total_debits || 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/creator">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Wallet</h1>
              <p className="text-sm text-gray-500">Manage your earnings and withdrawals</p>
            </div>
          </div>
          <WalletActions availableBalance={currentBalance} />
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Balance Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Current Balance */}
          <Card className="md:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {formatCurrency(currentBalance)}
                  </h2>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <Wallet className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Available for withdrawal
              </p>
            </CardContent>
          </Card>

          {/* Total Earnings */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-100 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Earnings</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(totalCredits)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Withdrawals */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-red-100 p-2 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Withdrawals</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(totalDebits)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Transaction History</CardTitle>
              <Badge variant="secondary">
                {balance.total_transactions} transaction{balance.total_transactions !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
                <p className="text-gray-600 mb-6">
                  Your wallet transactions will appear here once you start making sales.
                </p>
                <Link href="/dashboard/creator/artworks">
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    Upload Artwork
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {transactions.map((transaction) => {
                  const amount = typeof transaction.amount === 'string' 
                    ? parseFloat(transaction.amount) 
                    : transaction.amount
                  
                  const isCredit = transaction.transaction_type === 'credit' || transaction.transaction_type === 'refund'
                  
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-gray-100 p-2 rounded-lg">
                          {getTransactionIcon(transaction.transaction_type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">
                              {transaction.description || 'Transaction'}
                            </p>
                            {getStatusBadge(transaction.status)}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(transaction.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {transaction.reference && (
                              <span className="font-mono">
                                Ref: {transaction.reference.slice(0, 12)}...
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${
                          isCredit ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isCredit ? '+' : '-'}{formatCurrency(amount)}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {transaction.transaction_type}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
