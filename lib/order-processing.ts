/**
 * Order Processing Utilities
 * Shared functions for order creation, payment verification, and notifications
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any

interface OrderItem {
  id: string
  order_id: string
  artwork_id: string
  creator_id: string
  quantity: number
  unit_price: number | string
}

interface Order {
  id: string
  order_number?: string
  buyer_id: string
  total_amount: number
  payment_status: string
  order_status: string
}

/**
 * Create wallet transactions for creators based on order items
 */
export async function createCreatorWalletTransactions(
  supabase: SupabaseClient,
  order: Order,
  orderItems: OrderItem[]
): Promise<{ creatorId: string; amount: number }[]> {
  try {
    // Group by creator and calculate totals
    const creatorTotals = new Map<string, number>()

    for (const item of orderItems) {
      const creatorId = item.creator_id
      if (creatorId) {
        const currentTotal = creatorTotals.get(creatorId) || 0
        const itemPrice =
          typeof item.unit_price === 'string'
            ? parseFloat(item.unit_price)
            : item.unit_price
        creatorTotals.set(
          creatorId,
          currentTotal + itemPrice * item.quantity
        )
      }
    }

    // Create wallet transactions for each creator
    const transactions: { creatorId: string; amount: number }[] = []
    for (const [creatorId, amount] of creatorTotals) {
      const { error } = await supabase.from('wallet_transactions').insert({
        user_id: creatorId,
        amount,
        transaction_type: 'credit',
        status: 'completed',
        description: `Payment for order #${order.order_number || order.id.substring(0, 8)}`,
        reference: `ORDER_${order.id}`,
      } as never)

      if (error) {
        console.error('Error creating wallet transaction:', error)
      } else {
        transactions.push({ creatorId, amount })
      }
    }

    return transactions
  } catch (error) {
    console.error('Error creating wallet transactions:', error)
    return []
  }
}

/**
 * Send order notifications to buyer and creators
 */
export async function sendOrderNotifications(
  supabase: SupabaseClient,
  order: Order,
  orderItems: OrderItem[],
  creatorTotals?: Map<string, number>
): Promise<void> {
  try {
    const orderRef = order.order_number || order.id.substring(0, 8)

    // Notify buyer
    await supabase.rpc('create_notification', {
      p_user_id: order.buyer_id,
      p_type: 'order',
      p_title: 'Order Confirmed!',
      p_message: `Your order #${orderRef} has been confirmed and is being processed.`,
      p_data: {
        order_id: order.id,
        amount: order.total_amount,
        status: order.order_status,
      },
    } as never)

    // Notify each creator (once per creator)
    const notifiedCreators = new Set<string>()
    for (const item of orderItems) {
      if (item.creator_id && !notifiedCreators.has(item.creator_id)) {
        notifiedCreators.add(item.creator_id)

        const amount = creatorTotals?.get(item.creator_id) || 0

        await supabase.rpc('create_notification', {
          p_user_id: item.creator_id,
          p_type: 'sale',
          p_title: 'New Sale!',
          p_message: `You have a new sale from order #${orderRef}`,
          p_data: {
            order_id: order.id,
            artwork_id: item.artwork_id,
            amount,
          },
        } as never)
      }
    }

    console.log('Notifications sent for order:', order.id)
  } catch (error) {
    console.error('Error sending notifications:', error)
  }
}

/**
 * Generate a unique order number
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `ORD-${timestamp}-${random}`
}

/**
 * Mark cart as completed
 */
export async function completeCart(
  supabase: SupabaseClient,
  cartId: string
): Promise<void> {
  try {
    await supabase.from('carts').update({ status: 'completed' } as never).eq('id', cartId)
  } catch (error) {
    console.error('Error completing cart:', error)
  }
}

/**
 * Process order completion (wallet + notifications + cart)
 */
export async function processOrderCompletion(
  supabase: SupabaseClient,
  order: Order,
  orderItems: OrderItem[],
  cartId?: string
): Promise<void> {
  try {
    // Create wallet transactions
    const creatorTransactions = await createCreatorWalletTransactions(
      supabase,
      order,
      orderItems
    )

    // Build creator totals map for notifications
    const creatorTotals = new Map<string, number>()
    for (const transaction of creatorTransactions) {
      creatorTotals.set(transaction.creatorId, transaction.amount)
    }

    // Send notifications
    await sendOrderNotifications(supabase, order, orderItems, creatorTotals)

    // Complete cart
    if (cartId) {
      await completeCart(supabase, cartId)
    }

    console.log('Order completion processed successfully:', order.id)
  } catch (error) {
    console.error('Error processing order completion:', error)
    throw error
  }
}
