'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Send, MessageCircle, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'

interface Message {
  id: string
  text: string
  sender: 'user' | 'support'
  timestamp: Date
}

export function WhatsAppChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! 👋 Welcome to L'oge Arts Support. How can we help you today?",
      sender: 'support',
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [userName, setUserName] = useState('')
  const [isNameSet, setIsNameSet] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+2348130864548'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return

    // If name is not set, use the first message as the user's name
    if (!isNameSet) {
      setUserName(inputMessage.trim())
      setIsNameSet(true)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: inputMessage,
          sender: 'user',
          timestamp: new Date(),
        },
        {
          id: (Date.now() + 1).toString(),
          text: `Nice to meet you, ${inputMessage.trim()}! 😊 What can I help you with?`,
          sender: 'support',
          timestamp: new Date(),
        },
      ])
      setInputMessage('')
      return
    }

    // Add user message
    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInputMessage('')

    // Simulate support response after a short delay
    setTimeout(() => {
      const autoReply: Message = {
        id: (Date.now() + 1).toString(),
        text: "Thanks for your message! Our support team will get back to you shortly. You can also reach us directly on WhatsApp for immediate assistance.",
        sender: 'support',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, autoReply])
    }, 1000)
  }

  const handleCallSupport = () => {
    // Open WhatsApp with all the conversation context
    const conversationText = messages
      .filter((msg) => msg.sender === 'user')
      .map((msg) => msg.text)
      .join('\n')
    
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\+/g, '')}?text=${encodeURIComponent(
      `Hi, I'm ${userName || 'a visitor'}.\n\n${conversationText || 'I need assistance.'}`
    )}`
    
    window.open(whatsappUrl, '_blank')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className="h-16 w-16 rounded-full bg-[#25D366] hover:bg-[#20BA5A] shadow-lg transition-all hover:scale-110 group relative"
            aria-label="Open WhatsApp Chat"
          >
            {/* Official WhatsApp Icon */}
            <svg
              viewBox="0 0 32 32"
              className="h-8 w-8 text-white"
              fill="currentColor"
            >
              <path d="M16.002 0h-.004C7.164 0 0 7.164 0 16c0 3.5 1.128 6.74 3.042 9.378L1.05 31.05l5.816-1.948C9.446 30.87 12.638 32 16.002 32 24.836 32 32 24.836 32 16S24.836 0 16.002 0zm9.46 22.838c-.393.985-2.316 1.87-3.186 1.948-.87.078-1.87.43-6.276-1.318-5.6-2.218-9.192-7.896-9.47-8.252-.278-.356-2.24-2.986-2.24-5.694s1.402-4.04 1.948-4.586c.546-.546 1.164-.7 1.556-.7.392 0 .784.002 1.126.02.36.018.856-.138 1.34 1.02.492 1.176 1.68 4.102 1.826 4.402.146.3.244.648.05 1.004-.195.356-.292.578-.57.892-.278.314-.584.7-.834.94-.278.268-.57.558-.244 1.096.326.538 1.448 2.39 3.11 3.87 2.136 1.906 3.932 2.498 4.49 2.778.558.28.884.234 1.21-.146.326-.38 1.396-1.626 1.768-2.186.372-.56.744-.467 1.254-.28.51.187 3.24 1.528 3.798 1.808.558.28.93.42 1.066.654.136.234.136 1.35-.257 2.336z" />
            </svg>
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-pulse" />
            <span className="absolute right-full mr-3 bg-gray-900 text-white text-sm py-2 px-3 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Chat with us
            </span>
          </Button>
        )}
      </div>

      {/* Chat Widget */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-[380px] h-[600px] shadow-2xl flex flex-col animate-in slide-in-from-bottom-5">
          {/* Header */}
          <CardHeader className="bg-[#075E54] text-white p-4 rounded-t-lg flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-green-600 font-bold">
                LA
              </div>
              <div>
                <h3 className="font-semibold text-base">L&apos;oge Arts Support</h3>
                <p className="text-xs text-green-100">Typically replies within minutes</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0 hover:bg-[#064B43] text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#ECE5DD]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-[#DCF8C6] text-gray-800 rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="text-sm break-words">{message.text}</p>
                  <span
                    className={`text-xs mt-1 block ${
                      message.sender === 'user' ? 'text-green-100' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Quick Actions */}
          {isNameSet && messages.length > 2 && (
            <div className="px-4 py-2 border-t bg-white">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-green-600 border-green-600 hover:bg-green-50"
                onClick={handleCallSupport}
              >
                <Phone className="h-4 w-4 mr-2" />
                Continue on WhatsApp
              </Button>
            </div>
          )}

          {/* Input */}
          <CardFooter className="p-4 border-t bg-white">
            <div className="flex w-full space-x-2">
              <Input
                placeholder={isNameSet ? 'Type your message...' : 'Enter your name...'}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                className="bg-green-500 hover:bg-green-600"
                disabled={!inputMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </>
  )
}
