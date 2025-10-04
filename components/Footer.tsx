'use client';
import { Github, Mail, Linkedin } from 'lucide-react';
import Link from 'next/link';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Made by Section */}
        <div className="text-center mb-8">
          <p className="text-gray-400 text-lg mb-4">
            Made by <span className="text-rose-500 font-semibold">Kritika Beniwal</span>
          </p>
          
          {/* Social Links */}
          <div className="flex items-center justify-center gap-6">
            <Link 
              href="https://github.com/Kritika11052005" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-6 h-6" />
            </Link>
            <Link 
              href="https://mail.google.com/mail/?view=cm&fs=1&to=ananya.benjwal@gmail.com"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Email"
            >
              <Mail className="w-6 h-6" />
            </Link>
            <Link 
              href="https://www.linkedin.com/in/kritika-benjwal/" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-6 h-6" />
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 my-8"></div>

        {/* Copyright */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            © {currentYear} DonorConnect. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;