import Link from "next/link";
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  CreditCard,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0a0a8c] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">About BookWorm</h3>
            <p className="text-gray-300 text-sm mb-4">
              Your one-stop destination for books across all genres. We believe
              in making reading accessible to everyone with our competitive
              prices and exceptional service.
            </p>
            <div className="flex items-center space-x-4">
              <Link
                href="https://facebook.com"
                className="text-gray-300 hover:text-white transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="https://instagram.com"
                className="text-gray-300 hover:text-white transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="https://twitter.com"
                className="text-gray-300 hover:text-white transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="https://youtube.com"
                className="text-gray-300 hover:text-white transition-colors"
              >
                <Youtube className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { label: "New Arrivals", href: "/new-arrivals" },
                { label: "Best Sellers", href: "/bestsellers" },
                { label: "Featured Books", href: "/featured" },
                { label: "Special Offers", href: "/deals" },
                { label: "Gift Cards", href: "/gift-cards" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2">
              {[
                { label: "Track Your Order", href: "/track-order" },
                { label: "Shipping Policy", href: "/shipping" },
                { label: "Returns & Exchanges", href: "/returns" },
                { label: "FAQs", href: "/faqs" },
                { label: "Contact Us", href: "/contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center text-sm text-gray-300">
                <Phone className="h-4 w-4 mr-2" />
                <span>+91 1234567890</span>
              </li>
              <li className="flex items-center text-sm text-gray-300">
                <Mail className="h-4 w-4 mr-2" />
                <span>support@bookworm.com</span>
              </li>
              <li className="flex items-start text-sm text-gray-300">
                <MapPin className="h-4 w-4 mr-2 mt-1" />
                <span>
                  123 Book Street, Reading Avenue,
                  <br />
                  Bookland, BK 12345
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="text-sm text-gray-300">
              © {new Date().getFullYear()} BookWorm. All rights reserved.
              <div className="mt-2 space-x-4">
                <Link
                  href="/privacy"
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-start md:justify-end space-x-4">
              <span className="text-sm text-gray-300">We Accept:</span>
              <div className="flex items-center space-x-2">
                <CreditCard className="h-8 w-8 text-gray-300" />
                <img src="/visa.svg" alt="Visa" className="h-6" />
                <img src="/mastercard.svg" alt="Mastercard" className="h-6" />
                <img src="/amex.svg" alt="American Express" className="h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
