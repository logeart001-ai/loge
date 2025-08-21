import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Reveal } from '@/components/reveal'
import { CountUp } from '@/components/count-up'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Award, Globe, Heart, TrendingUp, BookOpen, Upload, Calendar } from 'lucide-react'

export const metadata: Metadata = {
  title: "About — L'oge Arts",
  description: "Learn about L'oge Arts: our mission to celebrate contemporary African artistry across mediums and empower creators.",
}

export default function AboutPage() {
  const stats = [
    { icon: Users, label: 'Creators', value: 1200, suffix: '+' },
    { icon: BookOpen, label: 'Artworks', value: 8500, suffix: '+' },
    { icon: Globe, label: 'Countries', value: 25, suffix: '+' },
    { icon: TrendingUp, label: 'Community', value: 50000, suffix: '+' },
  ] as const

  const values = [
    { icon: Heart, title: 'Artist-First', text: 'We champion fair opportunities, visibility, and earnings for African creators.' },
    { icon: Award, title: 'Quality & Authenticity', text: 'Curated works and verified profiles ensure trust and excellence.' },
    { icon: Globe, title: 'Global Reach', text: "Connecting Africa’s creativity with collectors and fans worldwide." },
    { icon: Users, title: 'Community', text: 'Building connections between creators, collectors, and enthusiasts.' },
  ] as const

  const steps = [
    { icon: Upload, title: 'Creators Join', text: 'Artists sign up, verify profiles, and publish artworks or projects.' },
    { icon: Calendar, title: 'Discover & Engage', text: 'Fans browse, follow creators, and RSVP to cultural events.' },
    { icon: BookOpen, title: 'Collect & Support', text: 'Purchase unique works and support creators across mediums.' },
  ] as const

  const timeline = [
    { year: '2023', title: 'Foundation', text: 'L’oge Arts started with a simple mission: spotlight African creators.' },
    { year: '2024', title: 'Growth', text: 'Expanded to fashion, events, and literature; built a vibrant community.' },
    { year: '2025', title: 'Acceleration', text: 'Scaled globally with better discovery, curation, and creator tools.' },
  ] as const

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <Reveal>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">About L&apos;oge Arts</h1>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl">
              We celebrate contemporary African creativity across art, fashion, literature, and cultural experiences—
              empowering creators and connecting them with a global audience.
            </p>
          </Reveal>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Reveal>
              <Link href="/art">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6">Explore Gallery</Button>
              </Link>
            </Reveal>
            <Reveal delay={100}>
              <Link href="/auth/signup?type=creator">
                <Button variant="outline" className="border-gray-300">Join as Creator</Button>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={([0, 100, 200, 300] as const)[i]}> 
                <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-orange-100 rounded-lg mb-3">
                    <s.icon className="h-6 w-6 md:h-7 md:w-7 text-orange-600" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-gray-900">
                    <CountUp end={s.value as number} suffix={s.suffix as string} />
                  </div>
                  <div className="text-sm md:text-base text-gray-600">{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-8 md:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-6 md:gap-8">
          <Reveal>
            <Card>
              <CardContent className="p-6 md:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Mission</h2>
                <p className="text-gray-700 leading-relaxed">
                  To amplify African creativity by providing a trusted platform where creators can showcase their work,
                  grow sustainable careers, and reach supporters around the world.
                </p>
              </CardContent>
            </Card>
          </Reveal>
          <Reveal delay={100}>
            <Card>
              <CardContent className="p-6 md:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Vision</h2>
                <p className="text-gray-700 leading-relaxed">
                  A borderless creative economy where African artistry is discovered, celebrated, and collected globally.
                </p>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Our Values</h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={([0, 100, 200, 300] as const)[i]}>
                <Card className="bg-white hover:shadow-md transition-transform hover:-translate-y-0.5">
                  <CardContent className="p-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-4">
                      <v.icon className="h-6 w-6 text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{v.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{v.text}</p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">How L&apos;oge Works</h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={([0, 100, 200] as const)[i]}>
                <Card className="bg-white hover:shadow-md transition-transform hover:-translate-y-0.5">
                  <CardContent className="p-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-4">
                      <s.icon className="h-6 w-6 text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{s.text}</p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Milestones</h2>
          </Reveal>
          <div className="space-y-6 border-l border-gray-200 pl-6">
            {timeline.map((m, i) => (
              <Reveal key={m.year} delay={([0, 100, 200] as const)[i]}>
                <div className="relative">
                  <div className="absolute -left-3 top-1.5 w-5 h-5 bg-orange-500 rounded-full border-4 border-white shadow" />
                  <div>
                    <div className="text-sm text-gray-500">{m.year}</div>
                    <h3 className="font-semibold text-gray-900">{m.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{m.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Be part of the story</h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-gray-700 max-w-2xl mx-auto mb-8">
              Whether you&apos;re a creator or a collector, you help shape the future of African creativity.
            </p>
          </Reveal>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/signup?type=creator">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6">Join as Creator</Button>
            </Link>
            <Link href="/art">
              <Button variant="outline" className="border-gray-300">Explore Gallery</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
