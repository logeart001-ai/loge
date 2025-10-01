import type { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { WhatsAppButton } from '@/components/whatsapp-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Mail, Phone, HelpCircle, ShoppingCart, Package, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: "Customer Support — L'oge Arts",
  description: "Get help with your L'oge Arts experience. Contact our customer support team via WhatsApp, email, or phone.",
}

export default function SupportPage() {
  const faqs = [
    {
      category: 'Getting Started',
      icon: Users,
      questions: [
        {
          q: 'How do I create an account?',
          a: 'Click on "Sign Up" in the navigation menu, choose whether you\'re a creator or collector, fill in your details, and verify your email address.',
        },
        {
          q: 'What\'s the difference between creator and collector accounts?',
          a: 'Creator accounts allow you to upload and sell artworks, manage your profile, and track earnings. Collector accounts let you browse, purchase artworks, and manage your collection.',
        },
      ],
    },
    {
      category: 'Buying & Payments',
      icon: ShoppingCart,
      questions: [
        {
          q: 'How do I purchase an artwork?',
          a: 'Browse artworks, click on the one you like, add it to your cart, and proceed to checkout. You can pay securely using Paystack.',
        },
        {
          q: 'What payment methods do you accept?',
          a: 'We accept all major debit and credit cards through our secure payment processor, Paystack. Your payment information is encrypted and secure.',
        },
        {
          q: 'Can I get a refund?',
          a: 'Refund requests are handled on a case-by-case basis. Contact our support team within 7 days of purchase to discuss your specific situation.',
        },
      ],
    },
    {
      category: 'For Creators',
      icon: Package,
      questions: [
        {
          q: 'How do I upload my artwork?',
          a: 'Go to your Creator Dashboard, click "Upload New Artwork", fill in the details, upload images, set your price, and publish.',
        },
        {
          q: 'How do I get paid?',
          a: 'When your artwork is sold, the payment is credited to your wallet. You can request a payout to your bank account from your dashboard.',
        },
        {
          q: 'What commission does L\'oge Arts take?',
          a: 'We take a small commission on each sale to maintain and improve our platform. The exact percentage will be clearly displayed before you publish.',
        },
      ],
    },
    {
      category: 'Shipping & Delivery',
      icon: Package,
      questions: [
        {
          q: 'How long does shipping take?',
          a: 'Shipping times vary based on the creator\'s location and the shipping method chosen. Typically, domestic shipping takes 3-7 business days.',
        },
        {
          q: 'Do you ship internationally?',
          a: 'Yes, many of our creators offer international shipping. Shipping costs and times will be calculated at checkout.',
        },
        {
          q: 'How can I track my order?',
          a: 'Once your order ships, you\'ll receive a tracking number via email. You can also track your order from your dashboard.',
        },
      ],
    },
  ]

  const contactMethods = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with us in real-time',
      value: 'Click the green chat button',
      action: 'primary',
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      description: 'Message us on WhatsApp',
      value: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+2348130864548',
      action: 'whatsapp',
    },
    {
      icon: Mail,
      title: 'Email',
      description: 'Send us a message',
      value: 'support@logearts.com',
      link: 'mailto:support@logearts.com',
    },
    {
      icon: Phone,
      title: 'Phone',
      description: 'Call us directly',
      value: '+234 813 086 4548',
      link: 'tel:+2348130864548',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <HelpCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            How Can We Help You?
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Get quick answers to your questions or reach out to our support team
          </p>
          <p className="text-sm text-gray-500 mb-8">
            💬 Click the green chat button at the bottom right to start a conversation instantly
          </p>
          <div className="flex justify-center">
            <WhatsAppButton
              phoneNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}
              message="Hello! I need help with L'oge Arts."
            />
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">Get In Touch</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${method.action === 'primary' || method.action === 'whatsapp' ? 'bg-green-100' : 'bg-orange-100'}`}>
                      <method.icon className={`h-6 w-6 ${method.action === 'primary' || method.action === 'whatsapp' ? 'text-green-600' : 'text-orange-600'}`} />
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{method.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{method.description}</p>
                  {method.link ? (
                    <a
                      href={method.link}
                      className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
                    >
                      {method.value}
                    </a>
                  ) : method.action === 'primary' ? (
                    <p className="text-green-600 font-medium text-sm">{method.value}</p>
                  ) : (
                    <p className="text-gray-900 font-medium">{method.value}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {faqs.map((category, catIndex) => (
              <Card key={catIndex}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <category.icon className="h-5 w-5 text-orange-600" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {category.questions.map((faq, faqIndex) => (
                    <div key={faqIndex}>
                      <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                      <p className="text-gray-600 text-sm">{faq.a}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Still Need Help? */}
      <section className="py-16 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-gray-600 mb-8">
            Our support team is here to assist you. Reach out via WhatsApp for the fastest response.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <WhatsAppButton
              phoneNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}
              message="Hello! I have a question about L'oge Arts."
            />
            <a
              href="mailto:support@logearts.com"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200"
            >
              <Mail className="h-5 w-5" />
              <span>Email Support</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
