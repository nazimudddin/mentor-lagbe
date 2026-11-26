
"use client";

import Link from "next/link";
import {
  Mail,
  MapPin,
  Phone,
  ArrowUpRight,
} from "lucide-react";

import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-6 py-14">

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div>
            <Link href="/" className="text-2xl font-bold text-white">
              Mentor<span className="text-blue-500">Lagbe</span>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-7 text-slate-400">
              Connecting students with the right tutors. Find your perfect
              mentor and make learning easier with MentorLagbe.
            </p>

            <div className="mt-6 flex gap-3">
              <Link
                href="#"
                aria-label="Facebook"
                className="rounded-full bg-slate-800 p-3 transition hover:bg-blue-600 hover:text-white"
              >
                <FaFacebookF size={17} />
              </Link>

              <Link
                href="#"
                aria-label="Instagram"
                className="rounded-full bg-slate-800 p-3 transition hover:bg-pink-600 hover:text-white"
              >
                <FaInstagram size={17} />
              </Link>

              <Link
                href="#"
                aria-label="LinkedIn"
                className="rounded-full bg-slate-800 p-3 transition hover:bg-blue-700 hover:text-white"
              >
                <FaLinkedinIn size={17} />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-6 text-lg font-semibold text-white">
              Quick Links
            </h3>

            <ul className="space-y-4 text-sm">
              <li>
                <Link href="/" className="transition hover:text-blue-400">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/tuitions" className="transition hover:text-blue-400">
                  Browse Tuitions
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition hover:text-blue-400">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition hover:text-blue-400">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* For Users */}
          <div>
            <h3 className="mb-6 text-lg font-semibold text-white">
              For Users
            </h3>

            <ul className="space-y-4 text-sm">
              <li>
                <Link href="/register" className="transition hover:text-blue-400">
                  Become a Tutor
                </Link>
              </li>
              <li>
                <Link href="/tuitions" className="transition hover:text-blue-400">
                  Find a Tutor
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="transition hover:text-blue-400">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link href="/login" className="transition hover:text-blue-400">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-6 text-lg font-semibold text-white">
              Contact Us
            </h3>

            <ul className="space-y-5 text-sm">
              <li className="flex items-center gap-3">
                <Mail size={19} className="shrink-0 text-blue-500" />
                <span>support@mentorlagbe.com</span>
              </li>

              <li className="flex items-center gap-3">
                <Phone size={19} className="shrink-0 text-blue-500" />
                <span>+880 1XXXXXXXXX</span>
              </li>

              <li className="flex items-center gap-3">
                <MapPin size={19} className="shrink-0 text-blue-500" />
                <span>Bangladesh</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Footer */}
        <div className="mt-14 flex flex-col items-center justify-between gap-5 border-t border-slate-800 pt-7 text-center sm:flex-row">

          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} MentorLagbe. All rights reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link
              href="/privacy-policy"
              className="transition hover:text-blue-400"
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms"
              className="transition hover:text-blue-400"
            >
              Terms & Conditions
            </Link>
          </div>

          <Link
            href="#"
            className="flex items-center gap-1 text-sm text-blue-400 transition hover:text-blue-300"
          >
            Back to top <ArrowUpRight size={16} />
          </Link>

        </div>
      </div>
    </footer>
  );
};

export default Footer;