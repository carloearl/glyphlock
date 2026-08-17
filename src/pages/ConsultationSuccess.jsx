import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Calendar, Mail, Phone, Home, FileText } from "lucide-react";

export default function ConsultationSuccess() {
  return (
    <div className="min-h-screen bg-black text-white py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Success Animation */}
          <div className="text-center mb-12">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
              <div className="w-24 h-24 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Consultation <span className="bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">Booked!</span>
            </h1>
            <p className="text-xl text-gray-300">
              Thank you for choosing GlyphLock. We've received your consultation request.
            </p>
          </div>

          {/* What Happens Next */}
          <Card className="bg-gray-900 border-green-500/30 mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-white">What Happens Next?</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-2">1. Confirmation Email</h3>
                    <p className="text-gray-400">
                      You'll receive a confirmation email within the next few minutes with your consultation details.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-2">2. Schedule Your Session</h3>
                    <p className="text-gray-400">
                      Our team will contact you within 24 hours to schedule your 60-minute consultation at a time that works for you.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-2">3. Expert Consultation</h3>
                    <p className="text-gray-400">
                      Meet with our cybersecurity experts to discuss your security needs, explore solutions, and receive a custom proposal.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-2">4. Custom Proposal</h3>
                    <p className="text-gray-400">
                      Receive a detailed proposal tailored to your requirements, including pricing, timeline, and implementation plan.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Facts */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-purple-600/10 border-blue-500/30 mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-white">Your Consultation Includes</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-white">60-Minute Session</div>
                    <div className="text-sm text-gray-400">Deep dive into your security needs</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-white">Expert Analysis</div>
                    <div className="text-sm text-gray-400">Professional security assessment</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-white">Custom Recommendations</div>
                    <div className="text-sm text-gray-400">Tailored security solutions</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-white">No Obligation Quote</div>
                    <div className="text-sm text-gray-400">Transparent pricing proposal</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="bg-gray-900 border-gray-800 mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4 text-white">Need Immediate Assistance?</h2>
              <p className="text-gray-400 mb-6">
                If you have urgent questions or need to modify your consultation request, please contact us:
              </p>
              <div className="space-y-3 text-gray-300">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <div>
                    <span className="font-semibold">Email:</span> carloearl@glyphlock.com
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-400" />
                  <div>
                    <span className="font-semibold">Phone:</span> +1 (555) 123-4567
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl("Home")}>
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                <Home className="w-5 h-5 mr-2" />
                Return Home
              </Button>
            </Link>
            <Link to={createPageUrl("MasterCovenant")}>
              <Button size="lg" variant="outline" className="border-blue-500/50 hover:bg-blue-500/10 text-white">
                Learn More About Master Covenant
              </Button>
            </Link>
          </div>

          {/* Social Proof */}
          <div className="mt-12 text-center">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-3xl font-bold text-blue-400">Verified</div>
                <div className="text-sm text-gray-500">Coverage Details on Request</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-400">99.97%</div>
                <div className="text-sm text-gray-500">Threat Detection</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-400">24hr</div>
                <div className="text-sm text-gray-500">Response Time</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}