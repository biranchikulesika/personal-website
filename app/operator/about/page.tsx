'use client';

import { motion } from 'motion/react';
import { ProfilePageJsonLd } from '@/components/seo/JsonLd';
import { SITE_URL } from '@/lib/config/seo';

export default function OperatorAboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 md:px-12 pt-8 pb-20 md:pt-10 md:pb-32 relative flex flex-col font-sans">
      <ProfilePageJsonLd
        description="Cybersecurity, ethical hacking, OSINT, infrastructure, and understanding what exists beneath interfaces."
        url={`${SITE_URL}/operator/about`}
        image={`${SITE_URL}/images/og-fallback-operator.png`}
      />
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-2xl"
      >
        <div className="mb-12 md:mb-14">
          <h1 className="text-3xl md:text-4xl font-medium text-foreground tracking-tight">
            Why Signal Exists
          </h1>
        </div>
        
        <div className="space-y-8 md:space-y-10 text-body leading-[1.8] md:leading-[1.9] text-[15.5px] md:text-[16.5px]">
          <p>
            Operator is where I think about infrastructure, cybersecurity, operational thinking, and the invisible systems that quietly power the internet.
          </p>
          <p>
            I’m deeply curious about how systems behave under pressure, how infrastructure scales, and how reliability, privacy, and security shape modern technology.
          </p>
          <p>
            This corner focuses less on performance and more on understanding. Logs, architecture, networks, and operational systems are not just technical subjects to me. They are ways of observing how modern digital life actually functions beneath the surface.
          </p>
          <div className="pt-14 md:pt-16 border-t border-border-subtle">
            <p className="text-[13px] md:text-[14px] text-muted-text tracking-wide font-light">
              Reliable systems are usually invisible.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
