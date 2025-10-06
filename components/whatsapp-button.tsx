'use client'

import { MessageCircle, X } from 'lucide-react'
import { useState } from 'react'

interface WhatsAppFloatingButtonProps {
  phoneNumber?: string
  message?: string
  position?: 'bottom-right' | 'bottom-left'
}

export function WhatsAppFloatingButton({
  phoneNumber = '+2348130864548',
  message = 'Hello! I need help with L\'oge Arts.',
  position = 'bottom-right',
}: WhatsAppFloatingButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  // Format phone number for WhatsApp (remove spaces, dashes, and plus)
  const formattedPhone = phoneNumber.replace(/[\s+-]/g, '')
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`

  const positionClasses = position === 'bottom-right' 
    ? 'right-4 md:right-6' 
    : 'left-4 md:left-6'

  return (
    <>
      {/* Floating Button */}
      <div className={`fixed bottom-4 md:bottom-6 ${positionClasses} z-50`}>
        <div className="relative">
          {/* Tooltip */}
          {showTooltip && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-900 text-white text-sm rounded-lg px-4 py-2 shadow-lg">
              <p className="font-medium">Need help?</p>
              <p className="text-xs text-gray-300 mt-1">Chat with us on WhatsApp</p>
              <button
                onClick={() => setShowTooltip(false)}
                className="absolute top-1 right-1 text-gray-400 hover:text-white"
                aria-label="Close tooltip"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Main Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => setShowTooltip(false)}
            aria-label="Contact us on WhatsApp"
          >
            {/* WhatsApp Icon */}
            <svg
              viewBox="0 0 24 24"
              className="w-7 h-7"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>

            {/* Pulse Animation */}
            {isHovered && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>
            )}
          </a>

          {/* Show tooltip on first load */}
          {!showTooltip && (
            <button
              onClick={() => setShowTooltip(true)}
              className="sr-only"
              aria-label="Show WhatsApp help tooltip"
            />
          )}
        </div>
      </div>
    </>
  )
}

// Compact version for dashboard
export function WhatsAppButton({
  phoneNumber = '+2348130864548',
  message = 'Hello! I need help with L\'oge Arts.',
  variant = 'default',
}: {
  phoneNumber?: string
  message?: string
  variant?: 'default' | 'compact' | 'text'
}) {
  const formattedPhone = phoneNumber.replace(/[\s+-]/g, '')
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`

  if (variant === 'compact') {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200"
      >
        <MessageCircle className="h-5 w-5" />
        <span>WhatsApp Support</span>
      </a>
    )
  }

  if (variant === 'text') {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors duration-200"
      >
        <MessageCircle className="h-4 w-4" />
        <span>Chat on WhatsApp</span>
      </a>
    )
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
    >
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
      </svg>
      <span>Contact Support</span>
    </a>
  )
}
