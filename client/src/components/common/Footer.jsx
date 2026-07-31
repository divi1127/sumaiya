import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Navigation } from 'lucide-react';
import { motion } from "framer-motion"
import { FaWhatsapp, FaInstagram, FaFacebook, } from "react-icons/fa";
const Footer = () => {
  return (
    <footer className="bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-white/5 pt-16 pb-8 transition-colors duration-300">
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-slate-200 dark:border-white/5">
          {/* Brand & Description */}
          <div className="space-y-4">
            <Link to="/" className="text-2xl font-extrabold tracking-wider bg-linear-to-r from-yellow-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              SUMAIYA 99
            </Link>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Curating high-end digital gears, active apparel, and futuristic living decors tailored to redefine your daily lifestyle.
            </p>

          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-slate-800 dark:text-white font-bold text-sm tracking-wider uppercase mb-5">Shop Catalog</h3>
            <ul className="space-y-3.5 text-sm">
              <li>
                <Link to="/products?category=tech-gadgets" className="hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors">
                  Tech & Smart Gadgets
                </Link>
              </li>
              <li>
                <Link to="/products?category=fashion-apparel" className="hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors">
                  Fashion & Apparels
                </Link>
              </li>
              <li>
                <Link to="/products?category=home-living" className="hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors">
                  Minimalist Home Decor
                </Link>
              </li>
              <li>
                <Link to="/products?category=fitness-outdoor" className="hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors">
                  Fitness & Outdoor Gears
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer support */}
          <div>
            <h3 className="text-slate-800 dark:text-white font-bold text-sm tracking-wider uppercase mb-5">Customer Care</h3>
            <ul className="space-y-3.5 text-sm">
              <li>
                <Link to="/profile" className="hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors">
                  Manage Account
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors">
                  Track Purchases
                </Link>
              </li>
              <li>
                <Link to="/policy" className="hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors">
                  Returns & Refunds
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h2 className="text-slate-800 dark:text-white font-bold text-sm tracking-wider uppercase">Stay Updated</h2>
            <h3 className="text-sm leading-relaxed text-slate-500 dark:text-slate-400"> SUMAIYA 99</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              G.D.S.Complex (Upstairs) Post Office Road,
              4
              Kodaikanal - 624 101.
            </p>
            <div className="flex space-x-4 pt-2">
              <a className="hover:text-slate-900 dark:hover:text-white transition-colors" aria-label="Website">
                <FaWhatsapp className="w-5 h-5" />
              </a>
              <a
                href="mailto:kodai.sumaiya99@gmail.com"
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/kodai.sumaiya99?igsh=c2hmam40cTdwdWRm" target="_blank" className="hover:text-slate-900 dark:hover:text-white transition-colors" aria-label="Community">
                <FaInstagram className="w-5 h-5" />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61590114554907" target="_blank" className="hover:text-slate-900 dark:hover:text-white transition-colors" aria-label="Community">
                <FaFacebook className="w-5 h-5" />
              </a>
              <a href="https://maps.app.goo.gl/UZX58NuAc3dMN4Hg7" target="_blank" className="hover:text-slate-900 dark:hover:text-white transition-colors" aria-label="Community">
                <Navigation className="w-5 h-5" />
              </a>
            </div>
          </div>

        </div>

        {/* Legal & Attribution */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 text-xs text-slate-400 dark:text-slate-500 space-y-4 sm:space-y-0">
          <p>© {new Date().getFullYear()} SUMAIYA 99 Inc. All rights reserved.</p>
        </div>
        <div>
          <h1 className='text-center p-3 text-slate-400 dark:text-slate-500'>
            Developed By <span className='text-green-600 text-lg font-bold'> <a href="https://www.jodtech.in/" target='_blank' className="hover:text-green-500 dark:hover:text-green-400 transition-colors text-decoration: underline text-sm">JoD Tech</a></span>
          </h1>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
