'use client';

import { useState } from 'react';

export function LettersForm() {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  if (subscribed) {
    return (
      <p className="text-xs font-sans tracking-wide text-[#9d613c] dark:text-[#B97A56] italic">
        Thank you. I will write to you soon.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubscribe} className="space-y-4 w-full">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className="bg-transparent border-b border-[#E5DCCF] dark:border-[#E5DCCF]/25 dark:text-[#DDD2C5] text-[#43382F] py-1 w-full focus:outline-none focus:border-[#B97A56]/50 dark:focus:border-[#B97A56]/50 transition-colors placeholder:dark:text-[#6F645A] placeholder:text-[#7c6e62]/60 font-spectral italic text-[13.5px]"
        required
      />
      <button
        type="submit"
        className="dark:text-[#B6A798]/90 text-[#7c6e62]/90 hover:dark:text-[#B97A56] hover:text-[#9d613c] py-1 w-full transition-all duration-300 font-spectral italic text-[11.5px] uppercase tracking-widest cursor-pointer text-left"
      >
        Receive Letters
      </button>
    </form>
  );
}

export function LettersFormMobile() {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  if (subscribed) {
    return (
      <p className="text-xs font-sans tracking-wide text-[#9d613c] dark:text-[#B97A56] italic">
        Thank you. I will write to you soon.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubscribe} className="flex flex-col gap-4 max-w-md w-full">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className="bg-transparent border-b border-[#E5DCCF] dark:border-[#E5DCCF]/25 dark:text-[#DDD2C5] text-[#43382F] py-1.5 focus:outline-none focus:border-[#B97A56]/50 dark:focus:border-[#B97A56]/50 transition-colors placeholder:dark:text-[#6F645A] placeholder:text-[#7c6e62]/60 font-spectral italic text-sm"
        required
      />
      <button
        type="submit"
        className="dark:text-[#B6A798] text-[#7c6e62] hover:dark:text-[#B97A56] hover:text-[#9d613c] py-1 transition-colors font-spectral italic text-xs uppercase tracking-widest cursor-pointer text-left"
      >
        Receive Letters
      </button>
    </form>
  );
}
