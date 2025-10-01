# WhatsApp Chat Widget Documentation

## Overview
The WhatsApp Chat Widget provides an in-app messaging experience that allows users to chat with support directly on the website before optionally continuing the conversation on WhatsApp.

## Features

### 🎨 User Interface
- **Floating Button**: Green WhatsApp-style button in the bottom-right corner
- **Pulse Animation**: Red notification badge with pulse effect to attract attention
- **Hover Tooltip**: "Chat with us" message appears on hover
- **Chat Window**: 380x600px popup with WhatsApp-inspired design
- **Responsive**: Works seamlessly on desktop and mobile devices

### 💬 Chat Experience
- **Welcome Message**: Automatic greeting when chat opens
- **Name Collection**: First message collects the user's name for personalization
- **Real-time Messages**: Instant message display with timestamps
- **Message Bubbles**: User messages in green (right-aligned), support in white (left-aligned)
- **Auto-scroll**: Automatically scrolls to the latest message
- **Enter to Send**: Press Enter key to send messages quickly
- **Character Limit**: No artificial limits on message length

### 🔄 WhatsApp Integration
- **Continue Button**: "Continue on WhatsApp" button appears after initial exchange
- **Context Preservation**: All chat messages are included in the WhatsApp link
- **Automatic Formatting**: User name and conversation history formatted for WhatsApp
- **Deep Linking**: Opens WhatsApp Web or native app depending on device

## Technical Implementation

### File Structure
```
loge/
├── components/
│   └── whatsapp-chat-widget.tsx    # Main chat widget component
├── app/
│   ├── layout.tsx                   # Global layout with widget
│   └── support/
│       └── page.tsx                 # Support page with chat widget info
└── .env.local                       # Environment configuration
```

### Components

#### WhatsAppChatWidget
**Location**: `components/whatsapp-chat-widget.tsx`

**Type**: Client Component (`'use client'`)

**Key Features**:
- State management for messages, user name, and chat visibility
- Auto-scroll to latest messages
- Enter key support for sending messages
- WhatsApp deep linking with conversation context

**Props**: None (uses environment variables)

**Dependencies**:
- `lucide-react`: Icons (MessageCircle, X, Send, Phone)
- `@/components/ui/button`: Button component
- `@/components/ui/input`: Input field
- `@/components/ui/card`: Card components for layout

### Configuration

#### Environment Variables
File: `.env.local`

```env
NEXT_PUBLIC_WHATSAPP_NUMBER=+2348130864548
```

**Important**: 
- Must include the `NEXT_PUBLIC_` prefix to be accessible in client components
- Format: International format with country code (e.g., +234...)
- Used by the widget to generate WhatsApp links

### Integration Points

#### 1. Root Layout
**File**: `app/layout.tsx`

```tsx
import { WhatsAppChatWidget } from '@/components/whatsapp-chat-widget'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CartProvider>
          {children}
          <WhatsAppChatWidget />
        </CartProvider>
      </body>
    </html>
  )
}
```

#### 2. Support Page
**File**: `app/support/page.tsx`

Updated to include:
- Reference to chat widget in hero section
- "Live Chat" as first contact method
- Instructions to click the green button

#### 3. Navigation
Chat widget is accessible from:
- All pages (via floating button)
- Support page (dedicated mention)
- Creator dashboard (Support link in sidebar)
- Collector dashboard (Support link in sidebar)

## User Flow

### First-Time User Experience

1. **Initial View**
   - User sees floating green button in bottom-right
   - Pulse animation draws attention
   - Tooltip shows "Chat with us" on hover

2. **Opening Chat**
   - User clicks floating button
   - Chat window slides in from bottom
   - Welcome message appears instantly

3. **Name Collection**
   - Input placeholder shows "Enter your name..."
   - User types their name and presses Enter
   - System greets user by name: "Nice to meet you, [Name]! 😊 What can I help you with?"

4. **Conversation**
   - Input changes to "Type your message..."
   - User can type multiple messages
   - Each message gets auto-reply: "Thanks for your message! Our support team will get back to you shortly..."

5. **WhatsApp Transition**
   - After name is set and user sends messages, "Continue on WhatsApp" button appears
   - User clicks button
   - WhatsApp opens with pre-filled message including name and all conversation history

### Message Format Sent to WhatsApp

```
Hi, I'm [User Name].

[Message 1]
[Message 2]
[Message 3]
```

## Styling Guide

### Color Scheme
```css
Green (Primary): #22c55e (green-500), #16a34a (green-600)
Red (Notification): #ef4444 (red-500)
White (Support messages): #ffffff
Gray (Background): #e5ddd5 (WhatsApp-style)
```

### Animations
- **Pulse**: Red notification badge uses `animate-pulse`
- **Slide-in**: Chat window uses `animate-in slide-in-from-bottom-5`
- **Hover Scale**: Button scales to 1.1 on hover
- **Smooth Scroll**: Messages scroll with `behavior: 'smooth'`

### Responsive Breakpoints
- **Desktop**: Full 380px width chat window
- **Mobile**: Chat window adapts to screen size (consider full-width on small screens)

## Customization

### Change Chat Window Size
```tsx
// In whatsapp-chat-widget.tsx
<Card className="fixed bottom-6 right-6 z-50 w-[380px] h-[600px]">
  // Change w-[380px] and h-[600px] to desired dimensions
```

### Change Floating Button Position
```tsx
// In whatsapp-chat-widget.tsx
<div className="fixed bottom-6 right-6 z-50">
  // Change bottom-6 and right-6 to reposition
  // Examples: top-6, left-6, bottom-20, right-20
```

### Customize Auto-Replies
```tsx
// In handleSendMessage function
const autoReply: Message = {
  id: (Date.now() + 1).toString(),
  text: "Your custom reply here!",
  sender: 'support',
  timestamp: new Date(),
}
```

### Change Color Theme
```tsx
// Button color (currently green)
className="bg-green-500 hover:bg-green-600"
// Change to any Tailwind color: bg-blue-500, bg-purple-500, etc.

// Message bubbles
// User messages: bg-green-500
// Support messages: bg-white
```

## Best Practices

### User Experience
✅ Keep the floating button visible at all times
✅ Ensure quick initial response (welcome message is instant)
✅ Make the transition to WhatsApp optional, not forced
✅ Preserve conversation context when transitioning
✅ Use friendly, welcoming language

### Performance
✅ Component is client-side only (`'use client'`)
✅ Lazy loads (only renders when button is clicked)
✅ Minimal re-renders with proper state management
✅ Uses refs for DOM manipulation (auto-scroll)

### Accessibility
✅ Button has `aria-label` for screen readers
✅ Keyboard support (Enter to send)
✅ Clear visual hierarchy
✅ High contrast text
✅ Tooltips provide context

## Troubleshooting

### Chat widget not appearing
1. Check that `WhatsAppChatWidget` is imported in `app/layout.tsx`
2. Verify component is placed inside `<body>` tag
3. Check browser console for JavaScript errors
4. Ensure z-index (z-50) is not conflicted by other elements

### WhatsApp link not working
1. Verify `NEXT_PUBLIC_WHATSAPP_NUMBER` is set in `.env.local`
2. Check phone number format (must include country code with +)
3. Restart dev server after changing environment variables
4. Test on different devices (desktop vs mobile behavior differs)

### Messages not showing
1. Check React state updates in browser DevTools
2. Verify `messages` state is being updated correctly
3. Check for console errors
4. Ensure `messagesEndRef` is attached to correct element

### Styling issues
1. Verify Tailwind CSS is configured correctly
2. Check for conflicting global styles
3. Inspect element in browser DevTools
4. Ensure all UI components are properly imported

## Future Enhancements

### Potential Features
- [ ] **Backend Integration**: Connect to real-time messaging service
- [ ] **Agent Responses**: Allow support agents to respond directly
- [ ] **File Upload**: Enable users to share images/documents
- [ ] **Typing Indicators**: Show when support is typing
- [ ] **Read Receipts**: Indicate message read status
- [ ] **Message History**: Persist conversations across sessions
- [ ] **Multi-language**: Support multiple languages
- [ ] **Business Hours**: Show availability status
- [ ] **Canned Responses**: Quick replies for common questions
- [ ] **Analytics**: Track chat engagement metrics

### Integration Ideas
- **CRM Integration**: Sync conversations to customer management system
- **Ticket System**: Create support tickets from chats
- **Email Fallback**: Send transcript to user's email
- **Knowledge Base**: Suggest relevant articles based on questions
- **Chatbot**: Add AI-powered initial responses

## Support & Maintenance

### Regular Checks
- Monitor WhatsApp number validity
- Review and update auto-reply messages
- Test on different browsers and devices
- Check analytics for usage patterns
- Update dependencies regularly

### Contact
For questions about the chat widget implementation:
- Technical issues: Check documentation first
- Feature requests: Submit through project management system
- Bugs: Report with steps to reproduce

## Version History

### v1.0.0 (Current)
- Initial implementation
- Basic chat interface
- WhatsApp integration
- Name collection
- Auto-replies
- Conversation context preservation

---

**Last Updated**: October 2025
**Maintained By**: L'oge Arts Development Team
