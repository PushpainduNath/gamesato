import React from 'react';
import { Metadata } from 'next';
import ContactClientView from './ContactClientView';

export const metadata: Metadata = {
  title: 'Contact Us | Gamesato Support & Inquiries',
  description: 'Get in touch with the Gamesato team for support, developer publishing inquiries, or general questions.',
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactPage() {
  return <ContactClientView />;
}
