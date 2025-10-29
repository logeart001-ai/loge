// Main logistics service that manages multiple providers
import { LogisticsProvider, ShipmentRequest, ShippingQuote, TrackingInfo } from './types'
import { SendboxProvider } from './providers/sendbox'
import { GIGProvider } from './providers/gig'
import { FallbackProvider } from './providers/fallback'

export class LogisticsService {
  private providers: LogisticsProvider[] = []

  constructor() {
    // Initialize providers with API keys from environment
    if (process.env.SENDBOX_API_KEY) {
      this.providers.push(new SendboxProvider(process.env.SENDBOX_API_KEY))
    }
    
    if (process.env.GIG_API_KEY) {
      this.providers.push(new GIGProvider(process.env.GIG_API_KEY))
    }
    
    // Always add fallback provider for testing/development
    this.providers.push(new FallbackProvider())
  }

  async getShippingQuotes(request: ShipmentRequest): Promise<ShippingQuote[]> {
    const allQuotes: ShippingQuote[] = []

    // Get quotes from all available providers
    await Promise.allSettled(
      this.providers.map(async (provider) => {
        try {
          const quotes = await provider.getQuote(request)
          allQuotes.push(...quotes)
        } catch (error) {
          console.error(`Error getting quotes from ${provider.name}:`, error)
        }
      })
    )

    // Sort by price (cheapest first)
    return allQuotes.sort((a, b) => a.price - b.price)
  }

  async createShipment(request: ShipmentRequest, providerName?: string): Promise<{ tracking_number: string; provider: string; label_url?: string }> {
    let selectedProvider: LogisticsProvider | undefined

    if (providerName) {
      selectedProvider = this.providers.find(p => p.name === providerName)
    }

    // If no specific provider requested or provider not found, use the first available
    if (!selectedProvider && this.providers.length > 0) {
      selectedProvider = this.providers[0]
    }

    if (!selectedProvider) {
      throw new Error('No logistics providers available')
    }

    try {
      const result = await selectedProvider.createShipment(request)
      return {
        ...result,
        provider: selectedProvider.name
      }
    } catch (error) {
      console.error(`Error creating shipment with ${selectedProvider.name}:`, error)
      
      // Try with next available provider if the first one fails
      if (this.providers.length > 1) {
        const nextProvider = this.providers.find(p => p.name !== selectedProvider!.name)
        if (nextProvider) {
          const result = await nextProvider.createShipment(request)
          return {
            ...result,
            provider: nextProvider.name
          }
        }
      }
      
      throw error
    }
  }

  async trackShipment(tracking_number: string, providerName: string): Promise<TrackingInfo> {
    const provider = this.providers.find(p => p.name === providerName)
    
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`)
    }

    return await provider.trackShipment(tracking_number)
  }

  async cancelShipment(tracking_number: string, providerName: string): Promise<boolean> {
    const provider = this.providers.find(p => p.name === providerName)
    
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`)
    }

    return await provider.cancelShipment(tracking_number)
  }

  getAvailableProviders(): string[] {
    return this.providers.map(p => p.name)
  }

  // Helper method to calculate shipping for art items (special handling)
  calculateArtShipping(artworkValue: number, dimensions: { length: number; width: number; height: number }, weight: number) {
    return {
      weight: Math.max(weight, 0.5), // Minimum 0.5kg for art items
      fragile: true,
      insurance_required: artworkValue > 50000, // Require insurance for items over ₦50k
      special_handling: artworkValue > 100000 // Special handling for high-value items
    }
  }

  // Helper method for book shipping (usually lighter, standard handling)
  calculateBookShipping(bookValue: number, weight: number) {
    return {
      weight: Math.max(weight, 0.2), // Minimum 0.2kg for books
      fragile: false,
      insurance_required: bookValue > 20000,
      special_handling: false
    }
  }

  // Helper method for fashion shipping
  calculateFashionShipping(fashionValue: number, weight: number) {
    return {
      weight: Math.max(weight, 0.3), // Minimum 0.3kg for fashion
      fragile: false,
      insurance_required: fashionValue > 30000,
      special_handling: false
    }
  }
}