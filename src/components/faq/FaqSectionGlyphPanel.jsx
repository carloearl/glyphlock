import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion"
import {
  ShieldCheck,
  Sparkles,
  ScanLine,
  AlertTriangle,
  LockKeyhole,
  HelpCircle,
  Zap,
  Gift,
  Shield,
  Building,
  Users,
  Link,
  Globe,
  DollarSign,
  Package,
  Crown,
  X,
  CreditCard,
  Heart,
  RefreshCw,
  Plus,
  Calendar,
  QrCode,
  Wand,
  Eye,
  Lock,
  Map,
  Layers,
  Smile,
  Brain,
  Bot,
  Code,
  ShoppingCart,
  Star,
  Wifi,
  Atom,
  FileCheck,
  Award,
  Key,
  MapPin,
  Flag,
  ShieldAlert,
  Monitor,
  Download,
  Settings,
  Smartphone,
  MessageCircle,
  Clock,
  GraduationCap,
  Wrench,
  Briefcase,
  Trash,
  AlertCircle
} from "lucide-react"
import FAQ_MASTER_DATA from "@/components/content/faqMasterData"

const ICON_MAP = {
  ShieldCheck, Sparkles, ScanLine, AlertTriangle, LockKeyhole, HelpCircle,
  Zap, Gift, Shield, Building, Users, Link, Globe, DollarSign, Package,
  Crown, X, CreditCard, Heart, RefreshCw, Plus, Calendar, QrCode, Wand,
  Eye, Lock, Map, Layers, Smile, Brain, Bot, Code, ShoppingCart, Star,
  Wifi, Atom, FileCheck, Award, Key, MapPin, Flag, ShieldAlert, Monitor,
  Download, Settings, Smartphone, MessageCircle, Clock, GraduationCap,
  Wrench, Briefcase, Trash, AlertCircle
}

const CATEGORIES = ["All", ...Array.from(new Set(FAQ_MASTER_DATA.map(f => f.category)))]

export default function FaqSectionGlyphPanel() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")

  const filteredFaqs = useMemo(() => {
    const q = query.trim().toLowerCase()
    return FAQ_MASTER_DATA.filter(item => {
      const inCategory = category === "All" || item.category === category
      const inQuery =
        !q ||
        item.q.toLowerCase().includes(q) ||
        item.a.join(" ").toLowerCase().includes(q)
      return inCategory && inQuery
    })
  }, [query, category])

  return (
    <section className="w-full px-4 sm:px-6 md:px-8 py-10 md:py-14">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 md:mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-semibold text-[#c7a7ff] tracking-tight">
              Protocol Authority Documentation
            </h2>
            <p className="text-gray-400 text-sm md:text-base">
              Precise answers. No marketing. Protocol-governed verification only.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-72">
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search questions or keywords"
                className="bg-[#0b0e16] border-[#232744] text-gray-200 placeholder:text-gray-500 focus-visible:ring-[#7a3cff] h-11"
                aria-label="Search FAQ"
              />
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#8a66ff]">
                <ScanLine className="w-4 h-4 opacity-80" />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={[
                    "shrink-0 h-10 px-3 rounded-lg text-sm font-medium transition-all",
                    "border border-[#232744] bg-[#0b0e16] text-gray-300",
                    "hover:border-[#5d2cff] hover:text-[#c7a7ff]",
                    category === cat
                      ? "border-[#7a3cff] text-[#e1d2ff] shadow-[0_0_18px_rgba(122,60,255,0.45)]"
                      : ""
                  ].join(" ")}
                  aria-pressed={category === cat}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Card className="relative overflow-hidden rounded-2xl bg-[#06070c] border border-[#1d2034] shadow-[0_0_30px_rgba(90,0,255,0.18)]">
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(140,80,255,0.25),transparent_60%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.6),transparent)] animate-pulse" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.05)_0,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_6px)] mix-blend-overlay" />
          </div>

          <div className="relative p-4 sm:p-6 md:p-8">
            {filteredFaqs.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                No matches. Try another keyword or category.
              </div>
            ) : (
              <Accordion type="single" collapsible className="space-y-3">
                {filteredFaqs.map(item => {
                  const Icon = ICON_MAP[item.icon] || ShieldCheck
                  return (
                    <AccordionItem
                      key={item.id}
                      value={item.id}
                      className="rounded-xl border border-[#232744] bg-[#0c0f18] px-3 sm:px-4 md:px-5 shadow-[inset_0_0_0_1px_rgba(90,0,255,0.12)] hover:border-[#5d2cff] transition-all"
                    >
                      <AccordionTrigger className="py-4 md:py-5 hover:no-underline">
                        <div className="flex items-start gap-3 text-left">
                          <div className="mt-0.5 rounded-lg bg-[#11152a] border border-[#2a2f55] p-2 shadow-[0_0_12px_rgba(122,60,255,0.35)]">
                            <Icon className="w-5 h-5 text-[#b88cff]" />
                          </div>
                          <div>
                            <div className="text-[#d6c3ff] font-semibold text-base md:text-lg leading-snug">
                              {item.q}
                            </div>
                            <div className="mt-1 text-xs md:text-sm text-[#8d86b8]">
                              {item.category}
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="pb-4 md:pb-5">
                        <div className="pl-12 md:pl-14 pr-2 space-y-3 text-gray-300 leading-relaxed">
                          {item.a.map((line, i) => (
                            <p key={i} className="text-sm md:text-base">
                              {line}
                            </p>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            )}
          </div>
        </Card>

        <div className="mt-6 text-xs md:text-sm text-gray-500">
          Tip: This knowledge base is mirrored inside Glyph, the site assistant, and the AI chat page so users can ask in plain language and get the same answers.
        </div>
      </div>
    </section>
  )
}